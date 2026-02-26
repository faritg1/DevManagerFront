import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Building2,
  Code2,
  Filter,
  Tag,
  Layers,
  AlertCircle,
} from "lucide-react";
import { skillsService } from "../../../shared/api";
import type { SkillDto, CreateSkillRequest, SkillType } from "../../../shared/api/types";
import { useToast, useConfig } from "../../../shared/context";
import { useConfirm } from "../../../shared/hooks";
import { Card, Badge, Button, Input, Modal } from "../../../shared/ui";
import { SkillFormModal } from "../components/SkillFormModal";

type FilterType = "all" | "global" | "organizational";

export const SkillsCatalogPage: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const { catalogs } = useConfig();

  // ─── State ──────────────────────────────────────────────
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillDto | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Data fetching ──────────────────────────────────────
  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await skillsService.getAll();
      if (response.success && response.data) {
        setSkills(response.data);
      } else {
        toast.error("Error al cargar habilidades", response.message || undefined);
      }
    } catch (error) {
      console.error("Failed to load skills:", error);
      toast.error("Error", "No se pudieron cargar las habilidades");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // ─── Derived data ───────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set<string>();
    skills.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let result = skills;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.category && s.category.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (filterType === "global") {
      result = result.filter((s) => s.skillType === 0);
    } else if (filterType === "organizational") {
      result = result.filter((s) => s.skillType === 1);
    }

    // Category filter
    if (filterCategory !== "all") {
      result = result.filter((s) => s.category === filterCategory);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [skills, searchQuery, filterType, filterCategory]);

  const stats = useMemo(
    () => ({
      total: skills.length,
      global: skills.filter((s) => s.skillType === 0).length,
      organizational: skills.filter((s) => s.skillType === 1).length,
      categoriesCount: categories.length,
    }),
    [skills, categories]
  );

  // ─── Handlers ───────────────────────────────────────────
  const handleCreate = () => {
    setEditingSkill(null);
    setIsModalOpen(true);
  };

  const handleEdit = (skill: SkillDto) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };

  const handleDelete = async (skill: SkillDto) => {
    const ok = await confirm({
      message: `¿Estás seguro de eliminar la habilidad "${skill.name}"? Esta acción no se puede deshacer.`,
    });
    if (!ok) return;

    setDeletingId(skill.id);
    try {
      const response = await skillsService.delete(skill.id);
      if (response.success) {
        toast.success("Habilidad eliminada correctamente");
        setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      } else {
        toast.error("Error al eliminar", response.message || undefined);
      }
    } catch (error) {
      console.error("Failed to delete skill:", error);
      toast.error("Error", "Ocurrió un error al eliminar la habilidad");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSkill(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadSkills();
  };

  // ─── Render helpers ─────────────────────────────────────
  const renderSkillTypeIcon = (type: number) =>
    type === 0 ? (
      <Globe size={14} className="text-blue-500" />
    ) : (
      <Building2 size={14} className="text-amber-500" />
    );

  const renderSkillTypeBadge = (type: number) =>
    type === 0 ? (
      <Badge variant="info" icon={Globe}>
        Global
      </Badge>
    ) : (
      <Badge variant="warning" icon={Building2}>
        Organizacional
      </Badge>
    );

  // ─── Loading skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"
            />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 size={24} className="text-primary" />
            Catálogo de Habilidades
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestiona las habilidades globales y organizacionales
          </p>
        </div>
        <Button icon={Plus} onClick={handleCreate}>
          Nueva Habilidad
        </Button>
      </div>

      {/* ─── Stat Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total habilidades</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Globe size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.global}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Globales</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Building2 size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.organizational}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Organizacionales</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Tag size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.categoriesCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Categorías</p>
          </div>
        </Card>
      </div>

      {/* ─── Filters ────────────────────────────────── */}
      <Card padding="sm">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center p-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o categoría..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-[#16222b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="global">Global</option>
              <option value="organizational">Organizacional</option>
            </select>
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-[#16222b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* ─── Skills Table ───────────────────────────── */}
      {filteredSkills.length === 0 ? (
        <Card className="p-10 text-center">
          <AlertCircle size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {searchQuery || filterType !== "all" || filterCategory !== "all"
              ? "No se encontraron habilidades con los filtros aplicados"
              : "No hay habilidades registradas"}
          </p>
          {!searchQuery && filterType === "all" && filterCategory === "all" && (
            <Button
              variant="outline"
              icon={Plus}
              className="mt-4"
              onClick={handleCreate}
            >
              Crear primera habilidad
            </Button>
          )}
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSkills.map((skill) => (
                  <tr
                    key={skill.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {renderSkillTypeIcon(skill.skillType)}
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {skill.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {skill.category ? (
                        <Badge variant="default" icon={Tag}>
                          {skill.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Sin categoría
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {renderSkillTypeBadge(skill.skillType)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          onClick={() => handleEdit(skill)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          isLoading={deletingId === skill.id}
                          onClick={() => handleDelete(skill)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#16222b]">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {filteredSkills.length} de {skills.length} habilidades
            </p>
          </div>
        </Card>
      )}

      {/* ─── Skill Form Modal ───────────────────────── */}
      <SkillFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        skill={editingSkill}
        categories={categories}
        catalogCategories={catalogs?.skillCategories ?? []}
      />
    </div>
  );
};

export default SkillsCatalogPage;
