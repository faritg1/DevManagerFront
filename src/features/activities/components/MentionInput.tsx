import React, { useState } from 'react';
import { Textarea } from '../../../shared/ui';
import type { Member } from './WorkItemFormModal';

interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
    /** Active project members that can be mentioned. */
    members: Member[];
}

/** An "@" followed by the letters typed so far, right before the caret. */
const OPEN_MENTION = /(^|\s)@([^\s@[\]()]*)$/;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Textarea that suggests project members after "@" and writes the token the API parses: @[Name](user:GUID). */
export const MentionInput: React.FC<Props> = ({ label, value, onChange, members }) => {
    const [caret, setCaret] = useState(0);
    const match = OPEN_MENTION.exec(value.slice(0, caret));
    const matches = match
        ? members.filter((m) => norm(m.name).includes(norm(match[2]))).slice(0, 5)
        : [];

    const pick = (m: Member) => {
        const start = caret - match![2].length - 1;
        const next = `${value.slice(0, start)}@[${m.name}](user:${m.id}) `;
        onChange(next + value.slice(caret));
        setCaret(next.length);
    };

    return (
        <div className="relative">
            <Textarea
                label={label}
                value={value}
                rows={3}
                maxLength={4000}
                onChange={(e) => { onChange(e.target.value); setCaret(e.target.selectionStart); }}
                onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
            />
            {matches.length > 0 && (
                <ul role="listbox" aria-label="Miembros del proyecto" className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-border-dark dark:bg-surface-dark">
                    {matches.map((m) => (
                        <li key={m.id} role="option" aria-selected={false}>
                            <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/10"
                                onMouseDown={(e) => { e.preventDefault(); pick(m); }}
                            >
                                {m.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
