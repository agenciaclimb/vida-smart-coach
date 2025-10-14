
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';
import handler from './webhook';

// Mocking dependencies
vi.mock('stripe');
vi.mock('@supabase/supabase-js');
vi.mock('micro');

const mockStripe = {
  webhooks: {
    constructEvent: vi.fn(),
  },
  subscriptions: {
    retrieve: vi.fn(),
  },
};

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
};

describe('Stripe Webhook Handler', () => {
  let req: Partial<VercelRequest>;
  let res: Partial<VercelResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    (Stripe as unknown as vi.Mock).mockImplementation(() => mockStripe);
    (createClient as vi.Mock).mockReturnValue(mockSupabase);

    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'supabase_test_key';
  });

  it('should return 405 for non-POST requests', async () => {
    req = { method: 'GET' };
    await handler(req as VercelRequest, res as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 400 if stripe-signature header is missing', async () => {
    req = { method: 'POST', headers: {} };
    await handler(req as VercelRequest, res as VercelResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle checkout.session.completed and update user profile', async () => {
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const mockStripeEvent = { id: 'evt_123', type: 'checkout.session.completed', data: { object: { id: 'cs_test_123', client_reference_id: mockUserId, subscription: 'sub_test_123', customer: 'cus_test_123' } } };
    const mockSubscription = { id: 'sub_test_123', customer: 'cus_test_123', status: 'active', items: { data: [{ price: { id: 'price_123' } }] }, current_period_end: 1672531199 };

    (buffer as vi.Mock).mockResolvedValue('raw_body');
    (mockStripe.webhooks.constructEvent as vi.Mock).mockReturnValue(mockStripeEvent);
    (mockStripe.subscriptions.retrieve as vi.Mock).mockResolvedValue(mockSubscription);
    
    // Correctly mock the chained Supabase calls for idempotency check
    mockQueryBuilder.select.mockReturnThis(); // from(...).select()
    mockQueryBuilder.single.mockResolvedValue({ error: null, data: null }); // ...single() -> event not found
    mockQueryBuilder.insert.mockResolvedValue({ error: null }); // from(...).insert() -> success

    req = { method: 'POST', headers: { 'stripe-signature': 'valid_signature' } };
    await handler(req as VercelRequest, res as VercelResponse);

    expect(mockSupabase.from).toHaveBeenCalledWith('stripe_events');
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({ event_id: 'evt_123' });
    expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123');
    expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
    expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ stripe_subscription_id: 'sub_test_123' }));
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', mockUserId);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should skip processing if event is already registered (idempotency)', async () => {
    const mockStripeEvent = { id: 'evt_duplicate', type: 'checkout.session.completed', data: { object: {} } };
    
    (buffer as vi.Mock).mockResolvedValue('raw_body');
    (mockStripe.webhooks.constructEvent as vi.Mock).mockReturnValue(mockStripeEvent);

    // Simulate unique constraint violation by returning an error
    mockQueryBuilder.insert.mockResolvedValue({ error: { code: '23505' } });

    req = { method: 'POST', headers: { 'stripe-signature': 'valid_signature' } };
    await handler(req as VercelRequest, res as VercelResponse);

    expect(mockSupabase.from).toHaveBeenCalledWith('stripe_events');
    expect(mockQueryBuilder.insert).toHaveBeenCalledTimes(1);
    expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, skipped: true });
  });
});
