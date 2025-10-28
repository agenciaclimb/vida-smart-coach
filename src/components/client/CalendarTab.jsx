import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Dumbbell,
  Leaf,
  Heart,
  Wind,
  Plus,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompletionCheckbox } from '@/components/client/CompletionCheckbox';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLifeCalendar } from '@/hooks/useLifeCalendar';
import { usePlanCompletions } from '@/hooks/usePlanCompletions';
import { toast } from 'react-hot-toast';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PLAN_ICONS = {
  physical: Dumbbell,
  nutritional: Leaf,
  emotional: Heart,
  spiritual: Wind,
};

const PLAN_COLORS = {
  physical: 'bg-blue-100 text-blue-700 border-blue-300',
  nutritional: 'bg-green-100 text-green-700 border-green-300',
  emotional: 'bg-pink-100 text-pink-700 border-pink-300',
  spiritual: 'bg-purple-100 text-purple-700 border-purple-300',
};

const STATUS_STYLES = {
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'in-progress': 'bg-amber-100 text-amber-700 border-amber-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-slate-100 text-slate-500 border-slate-200',
};

const PLAN_LABELS = {
  physical: 'plano físico',
  nutritional: 'plano nutricional',
  emotional: 'plano emocional',
  spiritual: 'plano espiritual',
};

const toDateKey = (date) => format(date, 'yyyy-MM-dd');

const resolveIcon = (event) => {
  if (event.type === 'plan') {
    const Icon = PLAN_ICONS[event.planType] || Target;
    return <Icon className="w-4 h-4" />;
  }
  if (event.type === 'checkin') {
    if (event.subtype === 'morning_checkin') return <Sun className="w-4 h-4" />;
    if (event.subtype === 'night_checkin') return <Moon className="w-4 h-4" />;
    return <CalendarIcon className="w-4 h-4" />;
  }
  return <Sparkles className="w-4 h-4" />;
};

const CalendarTab = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { eventsByDate, events, summary, loading, error, refetch } = useLifeCalendar({
    viewDate: currentDate,
    range: 'month',
  });

  const completionHooks = {
    physical: usePlanCompletions(user?.id, 'physical'),
    nutritional: usePlanCompletions(user?.id, 'nutritional'),
    emotional: usePlanCompletions(user?.id, 'emotional'),
    spiritual: usePlanCompletions(user?.id, 'spiritual'),
  };

  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      }),
    [currentDate],
  );

  const monthStats = useMemo(() => {
    const completionRate = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;
    return {
      total: summary.total,
      completed: summary.completed,
      pending: summary.pending + summary.inProgress,
      completionRate,
    };
  }, [summary]);

  const getEventsForDay = useCallback(
    (day) => {
      const key = toDateKey(day);
      if (!eventsByDate?.get) return [];
      return eventsByDate.get(key) || [];
    },
    [eventsByDate],
  );

  const selectedDateKey = toDateKey(selectedDate);
  const selectedDayEvents = useMemo(() => {
    if (!eventsByDate?.get) return [];
    return eventsByDate.get(selectedDateKey) || [];
  }, [eventsByDate, selectedDateKey]);

  const handlePreviousMonth = () => {
    const next = subMonths(currentDate, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleToggleChecklist = async (event, item) => {
    if (item.itemType === 'meta') return;
    const handler = completionHooks[event.planType];
    if (!handler?.toggleCompletion) return;

    try {
      await handler.toggleCompletion(item.id, item.itemType || event.metadata?.primaryItemType || 'exercise', item.points ?? 5);
      await handler.reload?.();
      await refetch();
    } catch (err) {
      console.error('[CalendarTab] erro ao alternar checklist:', err);
      toast.error('Não foi possível atualizar este item agora.');
    }
  };

  const handleCompleteEvent = async (event) => {
    if (!event?.checklist?.length) return;
    const handler = completionHooks[event.planType];
    if (!handler?.toggleCompletion) return;

    const pendingItems = event.checklist.filter((item) => item.itemType !== 'meta' && !item.completed);
    if (pendingItems.length === 0) return;

    try {
      for (const item of pendingItems) {
        await handler.toggleCompletion(item.id, item.itemType || event.metadata?.primaryItemType || 'exercise', item.points ?? 5);
      }
      await handler.reload?.();
      await refetch();
      toast.success('Progresso atualizado!');
    } catch (err) {
      console.error('[CalendarTab] erro ao concluir evento:', err);
      toast.error('Não foi possível concluir este evento.');
    }
  };

  const handleOpenPlan = (event) => {
    navigate('/dashboard?tab=plan', { state: { focus: event.planType } });
  };

  const handleFeedback = (event) => {
    const label = PLAN_LABELS[event.planType] || 'plano';
    const autoMessage = `Quero ajustar meu ${label}: ${event.title}`;
    navigate('/dashboard?tab=chat', { state: { autoMessage } });
  };

  const handleReschedule = (event) => {
    const label = PLAN_LABELS[event.planType] || 'plano';
    const autoMessage = `Preciso reagendar ${event.title} do meu ${label}.`;
    navigate('/dashboard?tab=chat', { state: { autoMessage } });
  };

  const handleOpenCheckin = (event) => {
    navigate('/dashboard?tab=dashboard', {
      state: { focus: 'checkin', targetDate: event.date.toISOString() },
    });
    toast('Role até o card de check-in para registrar agora.', { icon: '✅' });
  };

  const renderChecklist = (event) => {
    if (!event?.checklist?.length) return null;
    const handler = completionHooks[event.planType];

    return (
      <div className="mt-3 space-y-2">
        {event.checklist.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-md border border-slate-200 bg-white/70 p-2">
            <CompletionCheckbox
              id={item.id}
              checked={item.completed}
              onCheckedChange={() => handleToggleChecklist(event, item)}
              disabled={handler?.isProcessing?.(item.id) || loading}
              points={item.points}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">{item.label}</p>
              {item.detail && <p className="text-xs text-slate-500">{item.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEventActions = (event) => {
    if (event.type === 'plan') {
      return (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleCompleteEvent(event)} disabled={loading}>
            Concluir
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleReschedule(event)}>
            Reagendar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleFeedback(event)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Feedback
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleOpenPlan(event)}>
            Ver plano
          </Button>
        </div>
      );
    }

    if (event.type === 'checkin') {
      return (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleOpenCheckin(event)}>
            Abrir check-in
          </Button>
        </div>
      );
    }

    return null;
  };

  const statusBadge = (status) => STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Eventos no período</p>
                <p className="text-3xl font-bold text-blue-700">{monthStats.total}</p>
              </div>
              <Target className="h-10 w-10 text-blue-500 opacity-40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Concluídos</p>
                <p className="text-3xl font-bold text-emerald-700">{monthStats.completed}</p>
              </div>
              <Clock className="h-10 w-10 text-emerald-500 opacity-40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Progresso Geral</p>
                <p className="text-3xl font-bold text-amber-700">{monthStats.completionRate}%</p>
              </div>
              <RefreshCw className="h-10 w-10 text-amber-500 opacity-40" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800">Calendário de Vida</CardTitle>
            <CardDescription>Veja seus compromissos do plano, lembretes e ações registradas.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handlePreviousMonth}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Mês anterior
            </Button>
            <Button variant="outline" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" onClick={handleNextMonth}>
              Próximo mês
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={refetch} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Período</p>
                <p className="text-lg font-semibold text-slate-800">
                  {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
              {monthDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const hasEvents = dayEvents.length > 0;

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedDate(day)}
                    className={`relative min-h-[90px] rounded-lg border-2 p-2 text-left transition-all ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-slate-200 hover:border-primary/40'
                    } ${isToday ? 'bg-blue-50' : 'bg-white'} ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{format(day, 'd')}</span>
                      {isToday && (
                        <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold uppercase text-white">
                          Hoje
                        </span>
                      )}
                    </div>
                    {hasEvents && (
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`flex items-center gap-1 rounded border px-1 py-0.5 text-[11px] ${
                              event.type === 'plan'
                                ? PLAN_COLORS[event.planType] || 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {resolveIcon(event)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-400">+{dayEvents.length - 3} outras</div>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                  {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'evento' : 'eventos'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && (
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Atualizando agenda...
                  </div>
                )}

                {!loading && selectedDayEvents.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    <CalendarIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    Nenhum compromisso agendado para este dia.
                  </div>
                )}

                {selectedDayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        {resolveIcon(event)}
                        <span>{event.title}</span>
                      </div>
                      <Badge className={`${statusBadge(event.status)} border`}>
                        {event.status === 'completed'
                          ? 'Concluído'
                          : event.status === 'in-progress'
                          ? 'Em progresso'
                          : 'Pendente'}
                      </Badge>
                    </div>
                    {event.timeLabel && <p className="mt-1 text-xs text-slate-500">Horário sugerido: {event.timeLabel}</p>}
                    {event.metadata?.focus && (
                      <p className="mt-1 text-xs text-slate-500">Foco: {event.metadata.focus}</p>
                    )}
                    {event.metadata?.content && (
                      <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">{event.metadata.content}</p>
                    )}

                    {event.type === 'activity' && event.metadata?.description && (
                      <p className="mt-2 text-xs text-slate-600">{event.metadata.description}</p>
                    )}

                    {event.type === 'plan' && event.planType && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge className={PLAN_COLORS[event.planType] || 'bg-slate-100 text-slate-700 border-slate-200'}>
                          {PLAN_LABELS[event.planType] || 'Plano'}
                        </Badge>
                        <Badge variant="outline">
                          {event.progress.completed}/{event.progress.total} concluídos
                        </Badge>
                      </div>
                    )}

                    {renderChecklist(event)}
                    {renderEventActions(event)}
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-50 p-3">
                      <ExternalLink className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Integração com Google Calendar</h3>
                      <p className="text-sm text-slate-500">
                        Sincronize seus eventos com o Google Calendar (em breve).
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Conectar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarTab;

