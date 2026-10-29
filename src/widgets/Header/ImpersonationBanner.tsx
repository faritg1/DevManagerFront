import React, { useState } from 'react';
import { LogOut, UserCog } from 'lucide-react';
import { useAuth } from '../../shared/context';
import { formatTime } from '../../shared/format';

/** Persistent while a super admin acts as another user; "Salir" restores the super admin's own session. */
export const ImpersonationBanner: React.FC = () => {
    const { impersonation, stopImpersonation } = useAuth();
    const [leaving, setLeaving] = useState(false);
    if (!impersonation) return null;

    return (
        <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950">
            <UserCog size={18} aria-hidden="true" />
            <span>
                Estás actuando como <strong>{impersonation.targetName}</strong> en <strong>{impersonation.organizationName}</strong>
                <span className="font-normal"> (hasta las {formatTime(new Date(impersonation.expiresAt))})</span>
            </span>
            <span aria-hidden="true">—</span>
            <button
                type="button"
                disabled={leaving}
                onClick={() => { setLeaving(true); stopImpersonation(); }}
                className="inline-flex items-center gap-1 rounded-md bg-slate-950/10 px-2 py-0.5 font-semibold underline-offset-2 hover:bg-slate-950/20 hover:underline disabled:opacity-60"
            >
                <LogOut size={14} aria-hidden="true" />
                Salir de la suplantación
            </button>
        </div>
    );
};
