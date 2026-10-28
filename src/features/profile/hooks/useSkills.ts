import { useState, useEffect, useMemo } from 'react';
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

    const [allSkills, setAllSkills] = useState<SkillDto[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

    const loadSkills = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const resp = await skillsService.getEmployeeSkills(user.id);
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
        try {
            const resp = await skillsService.getAll();
            if (resp.success && resp.data) setAllSkills(resp.data);
        } catch (err) {
            console.error('[Skills] Error fetching available skills', err);
        } finally {
            setLoadingAvailable(false);
        }
    };

    const saveSkill = async (payload: UpsertEmployeeSkillRequest) => {
        setOpLoading(true);
        try {
            const resp = await skillsService.upsertEmployeeSkill(payload);
            if (resp.success) {
                await loadSkills();
                return true;
            }
        } catch (err) {
            console.error('[Skills] Error saving skill', err);
        } finally {
            setOpLoading(false);
        }
        return false;
    };

    const deleteSkill = async (skill: EmployeeSkillResponse) => {
        if (!user?.id) return false;
        setOpLoading(true);
        try {
            const resp = await skillsService.deleteEmployeeSkill(skill.id);
            if (resp.success) {
                setSkills(prev => prev.filter(s => s.id !== skill.id));
                return true;
            }
        } catch (err) {
            console.error('[Skills] Error deleting skill', err);
        } finally {
            setOpLoading(false);
        }
        return false;
    };

    const availableSkills = useMemo(() => {
        const myIds = new Set(skills.map(s => s.skillId));
        return allSkills.filter(s => !myIds.has(s.id));
    }, [skills, allSkills]);

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
