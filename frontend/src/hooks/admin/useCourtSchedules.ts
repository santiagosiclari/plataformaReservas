import { useEffect, useState } from "react";
import { listSchedules, createSchedule, updateSchedule, deleteSchedule } from "../../api/schedules.api";
import type { CourtSchedule, CreateCourtScheduleDTO, UpdateCourtScheduleDTO } from "../../components/admin";

export function useCourtSchedules(courtId: number | null) {
  const [schedules, setSchedules] = useState<CourtSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    if (!courtId) { setSchedules([]); return; }
    const sc = await listSchedules(courtId);
    setSchedules(sc);
  }
  useEffect(() => { reload().catch(console.error); }, [courtId]);

  async function create(s: CreateCourtScheduleDTO) {
    if (!courtId) return;
    setLoading(true); setMsg(null);
    try { await createSchedule(courtId, s); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo crear el horario"); }
    finally { setLoading(false); }
  }

  async function update(id: number, s: UpdateCourtScheduleDTO) {
    if (!courtId) return;
    setLoading(true); setMsg(null);
    try { await updateSchedule(courtId, id, s); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo actualizar el horario"); }
    finally { setLoading(false); }
  }

  async function remove(id: number) {
    if (!courtId) return;
    setLoading(true); setMsg(null);
    try { await deleteSchedule(courtId, id); await reload(); }
    catch (e: any) { setMsg(e?.message || "No se pudo eliminar el horario"); }
    finally { setLoading(false); }
  }

  return { schedules, loading, msg, setMsg, create, update, remove, reload };
}
