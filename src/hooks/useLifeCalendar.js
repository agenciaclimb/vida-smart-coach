import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, endOfMonth, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePlans } from '@/contexts/data/PlansContext';
import { supabase } from '@/lib/supabase';

const WEEKDAY_INDEX = {
  domingo: 0,
  sunday: 0,
  segunda: 1,
  'segunda feira': 1,
  'segunda-feira': 1,
  monday: 1,
  terca: 2,
  terça: 2,
  'terca feira': 2,
  'terca-feira': 2,
  'terça feira': 2,
  'terça-feira': 2,
  tuesday: 2,
  quarta: 3,
  'quarta feira': 3,
  'quarta-feira': 3,
  wednesday: 3,
  quinta: 4,
  'quinta feira': 4,
  'quinta-feira': 4,
  thursday: 4,
  sexta: 5,
  'sexta feira': 5,
  'sexta-feira': 5,
  friday: 5,
  sabado: 6,
  sábado: 6,
  saturday: 6,
};

const normalizeText = (value) =>
  value
    ? value
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';

const toDateKey = (date) => format(date, 'yyyy-MM-dd');

const parseDateSafely = (value) => {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

const getPlanStartDate = (plan) => {
  const started = parseDateSafely(plan?.started_at);
  if (started) return started;
  const created = parseDateSafely(plan?.created_at);
  if (created) return created;
  return new Date();
};

const getWeekdayOffset = (label, fallbackIndex = 0) => {
  const normalized = normalizeText(label);
  if (normalized && normalized in WEEKDAY_INDEX) {
    return WEEKDAY_INDEX[normalized];
  }
  return Math.min(Math.max(fallbackIndex, 0), 6);
};

const summarizeChecklist = (items) => {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  let status = 'pending';

  if (!total) {
    status = 'info';
  } else if (completed === 0) {
    status = 'pending';
  } else if (completed === total) {
    status = 'completed';
  } else {
    status = 'in-progress';
  }

  return { total, completed, status };
};

const generatePhysicalEvents = ({ plan, startDate, endDate, completions }) => {
  const data = plan?.plan_data;
  if (!data?.weeks?.length) return [];

  const planStart = startOfWeek(getPlanStartDate(plan), { weekStartsOn: 1 });
  const events = [];

  data.weeks.forEach((week, weekIndex) => {
    const weekAnchor = addDays(planStart, weekIndex * 7);

    (week?.workouts || []).forEach((workout, workoutIndex) => {
      const dayOffset = getWeekdayOffset(workout?.day, workoutIndex);
      const eventDate = addDays(weekAnchor, dayOffset);

      if (eventDate < startDate || eventDate > endDate) return;

      const checklist = (workout?.exercises || []).map((exercise, exerciseIndex) => {
        const identifier = `week_${weekIndex}_workout_${workoutIndex}_exercise_${exerciseIndex}`;
        return {
          id: identifier,
          label: exercise?.name || `Exercício ${exerciseIndex + 1}`,
          detail: exercise?.sets && exercise?.reps ? `${exercise.sets}x${exercise.reps}` : null,
          completed: completions.has(identifier),
          points: exercise?.points ?? 10,
          itemType: 'exercise',
        };
      });

      const summary = summarizeChecklist(checklist);

      events.push({
        id: `physical-${plan.id}-${weekIndex}-${workoutIndex}`,
        type: 'plan',
        subtype: 'physical_workout',
        planType: 'physical',
        title: workout?.name || workout?.day || `Treino ${weekIndex + 1}`,
        timeLabel: workout?.time || null,
        date: eventDate,
        dateKey: toDateKey(eventDate),
        status: summary.status,
        progress: summary,
        checklist,
        metadata: {
          weekNumber: week?.week || weekIndex + 1,
          focus: week?.focus || null,
          planId: plan?.id,
          primaryItemType: 'workout',
          workoutIndex,
        },
      });
    });
  });

  return events;
};

const generateDailyRecurringEvents = ({
  plan,
  planType,
  items,
  itemPrefix,
  startDate,
  endDate,
  completions,
  defaultPoints = 5,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const events = [];
  const start = new Date(startDate);
  const last = new Date(endDate);

  for (let day = new Date(start); day <= last; day = addDays(day, 1)) {
    items.forEach((item, index) => {
      const baseId = `${itemPrefix}_${index}`;
      const baseItemType =
        planType === 'nutritional'
          ? 'meal'
          : planType === 'emotional'
          ? 'routine'
          : planType === 'spiritual'
          ? 'practice'
          : 'item';
      const checklistItems = Array.isArray(item?.items)
        ? item.items.map((child, childIndex) => {
            const identifier = `${itemPrefix}_${index}_item_${childIndex}`;
            const label =
              typeof child === 'string'
                ? child
                : child?.name || child?.activity || child?.description || `Item ${childIndex + 1}`;
            return {
              id: identifier,
              label,
              detail: child?.quantity || child?.notes || null,
              completed: completions.has(identifier),
              points: child?.points ?? defaultPoints,
              itemType:
                planType === 'nutritional'
                  ? 'meal'
                  : planType === 'emotional'
                  ? 'routine'
                  : planType === 'spiritual'
                  ? 'practice'
                  : 'item',
            };
          })
        : [];

      // Consideramos o item principal concluído se o identificador base estiver marcado
      const primaryCompleted = completions.has(baseId);
      if (!checklistItems.length) {
        checklistItems.push({
          id: baseId,
          label: item?.name || item?.activity || item?.title || `Atividade ${index + 1}`,
          detail: item?.time || null,
          completed: primaryCompleted,
          points: item?.points ?? defaultPoints,
          itemType: baseItemType,
        });
      } else if (!primaryCompleted && checklistItems.every((entry) => entry.completed)) {
        // Se todos subtarefas foram concluídas, refletir no item principal
        checklistItems.push({
          id: `${baseId}__summary`,
          label: 'Resumo',
          detail: null,
          completed: true,
          points: 0,
          itemType: 'meta',
        });
      }

      const summary = summarizeChecklist(checklistItems);

      events.push({
        id: `${planType}-${plan?.id || 'guideline'}-${baseId}-${toDateKey(day)}`,
        type: 'plan',
        subtype: `${planType}_routine`,
        planType,
        title: item?.name || item?.activity || item?.title || `Rotina ${index + 1}`,
        timeLabel: item?.time || null,
        date: new Date(day),
        dateKey: toDateKey(day),
        status: primaryCompleted ? 'completed' : summary.status,
        progress: summary,
        checklist: checklistItems,
        metadata: {
          planId: plan?.id,
          recurring: true,
          baseIdentifier: baseId,
          baseItemType,
        },
      });
    });
  }

  return events;
};

const buildPlanEvents = ({ plans, startDate, endDate, completions }) => {
  if (!plans) return [];

  const events = [];

  if (plans.physical) {
    events.push(
      ...generatePhysicalEvents({
        plan: plans.physical,
        startDate,
        endDate,
        completions,
      }),
    );
  }

  if (plans.nutritional) {
    events.push(
      ...generateDailyRecurringEvents({
        plan: plans.nutritional,
        planType: 'nutritional',
        items: plans.nutritional?.plan_data?.meals,
        itemPrefix: 'meal',
        startDate,
        endDate,
        completions,
        defaultPoints: 5,
      }),
    );
  }

  if (plans.emotional) {
    events.push(
      ...generateDailyRecurringEvents({
        plan: plans.emotional,
        planType: 'emotional',
        items: plans.emotional?.plan_data?.daily_routines,
        itemPrefix: 'routine',
        startDate,
        endDate,
        completions,
        defaultPoints: 8,
      }),
    );
  }

  if (plans.spiritual) {
    events.push(
      ...generateDailyRecurringEvents({
        plan: plans.spiritual,
        planType: 'spiritual',
        items: plans.spiritual?.plan_data?.daily_practices,
        itemPrefix: 'practice',
        startDate,
        endDate,
        completions,
        defaultPoints: 8,
      }),
    );
  }

  return events;
};

const buildCheckinEvents = ({ startDate, endDate, interactions }) => {
  const events = [];
  const start = new Date(startDate);
  const last = new Date(endDate);

  const byDate = interactions.reduce((acc, interaction) => {
    const date = parseDateSafely(interaction?.created_at);
    if (!date) return acc;
    const key = toDateKey(date);
    const bucket = acc.get(key) || { records: [] };
    bucket.records.push(interaction);
    acc.set(key, bucket);
    return acc;
  }, new Map());

  for (let day = new Date(start); day <= last; day = addDays(day, 1)) {
    const key = toDateKey(day);
    const bucket = byDate.get(key);
    const interactionByType = bucket?.records?.reduce((map, interaction) => {
      if (interaction?.interaction_type) {
        map[interaction.interaction_type] = interaction;
      }
      return map;
    }, {});

    ['morning_checkin', 'night_checkin'].forEach((type) => {
      const displayName =
        type === 'morning_checkin'
          ? 'Check-in da manhã'
          : type === 'night_checkin'
          ? 'Check-in da noite'
          : 'Check-in';
      const record = interactionByType?.[type];

      events.push({
        id: `${type}-${key}`,
        type: 'checkin',
        subtype: type,
        title: displayName,
        date: new Date(day),
        dateKey: key,
        status: record ? 'completed' : 'pending',
        metadata: record
          ? {
              interactionId: record.id,
              stage: record.stage,
              content: record.content,
            }
          : null,
      });
    });

    if (bucket?.records?.length) {
      bucket.records
        .filter((interaction) => interaction?.interaction_type === 'manual_checkin')
        .forEach((interaction) => {
          events.push({
            id: `manual-checkin-${interaction.id}`,
            type: 'checkin',
            subtype: 'manual_checkin',
            title: 'Check-in manual',
            date: parseDateSafely(interaction.created_at) || new Date(day),
            dateKey: key,
            status: 'completed',
            metadata: {
              interactionId: interaction.id,
              stage: interaction.stage,
              content: interaction.content,
            },
          });
        });
    }
  }

  return events;
};

const buildActivityEvents = ({ activities }) =>
  (activities || []).map((activity) => {
    const date = parseDateSafely(activity?.activity_date) || parseDateSafely(activity?.created_at) || new Date();
    return {
      id: `activity-${activity?.id || `${activity?.activity_name}-${toDateKey(date)}`}`,
      type: 'activity',
      subtype: activity?.activity_type || 'general',
      title: activity?.activity_name || 'Atividade registrada',
      date,
      dateKey: toDateKey(date),
      status: 'completed',
      metadata: {
        points: activity?.points_earned,
        isBonus: activity?.is_bonus,
        description: activity?.description,
        activityKey: activity?.activity_key,
      },
    };
  });

const groupByDate = (events) =>
  events.reduce((acc, event) => {
    const bucket = acc.get(event.dateKey) || [];
    bucket.push(event);
    acc.set(event.dateKey, bucket);
    return acc;
  }, new Map());

export const useLifeCalendar = ({ viewDate = new Date(), range = 'month' } = {}) => {
  const { user } = useAuth();
  const { currentPlans } = usePlans();
  const [activities, setActivities] = useState([]);
  const [completions, setCompletions] = useState(new Map());
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { startDate, endDate } = useMemo(() => {
    if (range === 'week') {
      const start = startOfWeek(viewDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return { startDate: start, endDate: end };
    }
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    return { startDate: start, endDate: end };
  }, [viewDate, range]);

  const rangeKey = useMemo(
    () => `${format(startDate, 'yyyy-MM-dd')}::${format(endDate, 'yyyy-MM-dd')}`,
    [startDate, endDate],
  );

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setActivities([]);
      setCompletions(new Map());
      setInteractions([]);
      return;
    }

    setLoading(true);
    setError(null);

    const startDateKey = format(startDate, 'yyyy-MM-dd');
    const endDateKey = format(endDate, 'yyyy-MM-dd');
    const startIso = new Date(startDate);
    startIso.setHours(0, 0, 0, 0);
    const endIso = new Date(endDate);
    endIso.setHours(23, 59, 59, 999);

    try {
      const [activitiesRes, completionsRes, interactionsRes] = await Promise.all([
        supabase
          .from('daily_activities')
          .select(
            'id, activity_date, activity_name, activity_type, points_earned, description, is_bonus, bonus_type, metadata, activity_key, created_at',
          )
          .eq('user_id', user.id)
          .gte('activity_date', startDateKey)
          .lte('activity_date', endDateKey)
          .order('activity_date', { ascending: true }),
        supabase
          .from('plan_completions')
          .select('item_identifier, plan_type, item_type, points_awarded, completed_at')
          .eq('user_id', user.id),
        supabase
          .from('interactions')
          .select('id, created_at, interaction_type, content, stage, metadata')
          .eq('user_id', user.id)
          .gte('created_at', startIso.toISOString())
          .lte('created_at', endIso.toISOString())
          .order('created_at', { ascending: true }),
      ]);

      if (activitiesRes.error) throw activitiesRes.error;
      if (completionsRes.error) throw completionsRes.error;
      if (interactionsRes.error) throw interactionsRes.error;

      setActivities(activitiesRes.data || []);

      const completionsMap = new Map();
      (completionsRes.data || []).forEach((entry) => {
        if (entry?.item_identifier) {
          completionsMap.set(entry.item_identifier, entry);
        }
      });
      setCompletions(completionsMap);

      setInteractions(interactionsRes.data || []);
    } catch (err) {
      console.error('[useLifeCalendar] Failed to load calendar data:', err);
      setError(err.message || 'Erro ao carregar calendário de vida.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, rangeKey]);

  const events = useMemo(() => {
    const planEvents = buildPlanEvents({
      plans: currentPlans,
      startDate,
      endDate,
      completions,
    });

    const checkinEvents = buildCheckinEvents({
      startDate,
      endDate,
      interactions,
    });

    const activityEvents = buildActivityEvents({ activities });

    const combined = [...planEvents, ...checkinEvents, ...activityEvents].sort((a, b) => {
      if (a.date.getTime() === b.date.getTime()) {
        return (a.timeLabel || '').localeCompare(b.timeLabel || '');
      }
      return a.date.getTime() - b.date.getTime();
    });

    return combined;
  }, [currentPlans, startDate, endDate, completions, interactions, activities]);

  const eventsByDate = useMemo(() => groupByDate(events), [events]);

  const summary = useMemo(() => {
    const totals = { total: events.length, completed: 0, pending: 0, inProgress: 0 };
    events.forEach((event) => {
      if (event.status === 'completed') totals.completed += 1;
      else if (event.status === 'pending' || event.status === 'info') totals.pending += 1;
      else totals.inProgress += 1;
    });
    return totals;
  }, [events]);

  return {
    loading,
    error,
    events,
    eventsByDate,
    summary,
    startDate,
    endDate,
    refetch: fetchData,
  };
};
