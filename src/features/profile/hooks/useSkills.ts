import { useState, useEffect } from 'react';
import { skillsService } from '../../../shared/api';
import type { EmployeeSkillResponse, SkillDto, UpsertEmployeeSkillRequest } from '../../../shared/api/types';
import { useAuth } from '../../../shared/context';

interface UseSkillsResult {
    skills: EmployeeSkillResponse[];
    isLoading: boolean;
    opLoading: boolean;
    loadSkills: () => Promise<void>;
    availableSkills: SkillDto[];
    loadingAvailable: boolean;
    fetchAvailableSkills: () => Promise<void>;
    saveSkill: (payload: UpsertEmployeeSkillRequest) => Promise<boolean>;
    deleteSkill: (skill: EmployeeSkillResponse) => Promise<boolean>;
}

export function useSkills(): UseSkillsResult {
    const { user } = useAuth();
    const [skills, setSkills] = useState<EmployeeSkillResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [opLoading, setOpLoading] = useState(false);

    const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

    const loadSkills = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        console.log('[Skills] Cargando habilidades del usuario:', user.id);
        try {
            const resp = await skillsService.getEmployeeSkills(user.id);
            console.log('[Skills] Respuesta:', resp);
            if (resp.success && resp.data) setSkills(resp.data);
        } catch (err) {
            console.error('[Skills] Error loading employee skills', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableSkills = async () => {
        if (!user?.id) return;
        setLoadingAvailable(true);
        console.log('[Skills] Cargando habilidades disponibles...');
        try {
            const resp = await skillsService.getAll();
            console.log('[Skills] Respuesta skills disponibles:', resp);
            if (resp.success && resp.data) {
                const myIds = skills.map(s => s.skillId);
                setAvailableSkills(resp.data.filter(s => !myIds.includes(s.id)));
            }
        } catch (err) {
            console.error('[Skills] Error fetching available skills', err);
        } finally {
            setLoadingAvailable(false);
        }
    };

    const saveSkill = async (payload: UpsertEmployeeSkillRequest) => {
        setOpLoading(true);
        console.log('[Skills] Guardando habilidad:', payload);
        try {
            const resp = await skillsService.upsertEmployeeSkill(payload);
            console.log('[Skills] Respuesta save:', resp);
            if (resp.success) {
                await loadSkills();
                await fetchAvailableSkills();
                return true;
            }
        } catch (err) {
            console.error('[Skills] Error saving skill', err);
        } finally {
            setOpLoading(false);
        }
        return false;
    };

    // accept full skill so we can restore to available list after deletion
    const deleteSkill = async (skill: EmployeeSkillResponse) => {
        if (!user?.id) return false;
        setOpLoading(true);
        console.log('[Skills] Eliminando habilidad:', skill.id);
        try {
            const resp = await skillsService.deleteEmployeeSkill(skill.id);
            console.log('[Skills] Respuesta delete:', resp);
            if (resp.success) {
                setSkills(prev => prev.filter(s => s.id !== skill.id));
                // refresh available skills set
                await fetchAvailableSkills();
                return true;
            }
        } catch (err) {
            console.error('[Skills] Error deleting skill', err);
        } finally {
            setOpLoading(false);
        }
        return false;
    };

    useEffect(() => {
        loadSkills();
    }, [user?.id]);

    return {
        skills,
        isLoading,
        opLoading,
        loadSkills,
        availableSkills,
        loadingAvailable,
        fetchAvailableSkills,
        saveSkill,
        deleteSkill,
    };
}
