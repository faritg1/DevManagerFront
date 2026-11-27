import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { isApiError, runPanelSubmit } from '../../api/client';
import { useConfirm } from '../../context/ConfirmContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Modal } from '../Modal/Modal';

export interface FormPanelProps {
    isOpen: boolean;
    /** Called once the panel may close: at once when untouched, after "Descartar" when it has unsaved changes. */
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    /** Saves the form. Let API errors reject: the panel shows them and stays open. Close the panel yourself on success (not through `onClose`, which asks). */
    onSubmit: () => Promise<void>;
    /** Text of the primary button. */
    submitText?: string;
    submitDisabled?: boolean;
    /** Unsaved changes the panel cannot see: controls that emit no `input` or `change` event. */
    dirty?: boolean;
    /** Opens already at full screen, for forms that do not fit the normal width. */
    defaultExpanded?: boolean;
    /** Normal width. */
    size?: 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    /** Extra footer buttons, next to Cancelar. */
    footerExtra?: React.ReactNode;
    children: React.ReactNode;
}

const CONNECTION_ERROR = 'Error de conexión. Intenta de nuevo.';
const REQUIRED = 'Este campo es obligatorio';

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const controlsOf = (form: HTMLFormElement | null | undefined): Control[] =>
    [...(form?.elements ?? [])].filter((el): el is Control => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement);

/**
 * Puts each API field error on the control whose `name` is that field (any case; for a nested key, the full path
 * first and then its last segment) and returns the messages that found no place.
 * The message travels as the control's custom validity, so Input, Select and Textarea show it like a native one.
 */
const placeFieldErrors = (form: HTMLFormElement | null | undefined, errors: Record<string, string[]>): string[] => {
    const fields = controlsOf(form);
    const byName = (name: string) => fields.find((el) => el.name !== '' && el.name.toLowerCase() === name.toLowerCase());
    const rest: string[] = [];
    for (const [key, value] of Object.entries(errors)) {
        const messages = [value].flat();
        // ASP.NET's own model errors prefix body paths with "$.".
        const path = key.replace(/^\$\./, '');
        // The last segment is tried only for a plain nested path: an item of a list has no control of its own
        const el = byName(path) ?? (path.includes('[') ? undefined : byName(path.split('.').pop() ?? ''));
        // A disabled or read-only control takes no validity; a control that is not one of ours has nowhere to show it.
        if (el?.willValidate && messages.length > 0) {
            el.setCustomValidity(messages.join(' '));
            // Our fields cancel `invalid` to show the message themselves.
            if (!el.dispatchEvent(new Event('invalid', { cancelable: true }))) continue;
            el.setCustomValidity('');
        }
        rest.push(...messages);
    }
    return rest;
};

/**
 * Side panel for every create and edit form: fixed header and footer, saving state, API errors in an alert
 * and a confirmation before discarding unsaved changes. Lay the fields out with FormSection.
 */
export const FormPanel: React.FC<FormPanelProps> = ({
    isOpen, onClose, title, icon, onSubmit, submitText = 'Guardar', submitDisabled, dirty, defaultExpanded = false, size = '2xl', footerExtra, children,
}) => {
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<{ message: string; details: string[]; inFields?: boolean } | null>(null);
    // Refs, not state: a second Enter or Escape can arrive before the next render.
    const busy = useRef(false);
    const asking = useRef(false);
    const touched = useRef(false);
    const alertRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    // A panel that stays mounted starts clean each time it opens.
    useEffect(() => {
        if (!isOpen) return;
        touched.current = false;
        setError(null);
        setExpanded(defaultExpanded);
    }, [isOpen, defaultExpanded]);

    // With an error under a field, the first of those fields already has the focus.
    useEffect(() => { if (error && !error.inFields) alertRef.current?.focus(); }, [error]);

    /** The only way out for Cancelar, the X, Escape and the backdrop. */
    const close = async () => {
        if (busy.current || asking.current) return;
        if (touched.current || dirty) {
            asking.current = true;
            const discard = await confirm({
                title: 'Cambios sin guardar',
                message: 'Tienes cambios sin guardar. ¿Quieres descartarlos?',
                confirmText: 'Descartar',
                cancelText: 'Seguir editando',
            });
            asking.current = false;
            if (!discard) return;
        }
        onClose();
    };

    const submit = async () => {
        if (busy.current || submitDisabled) return;
        busy.current = true;
        setSubmitting(true);
        setError(null);
        try {
            await runPanelSubmit(onSubmit);
        } catch (e) {
            if (isApiError(e)) {
                const total = Object.values(e.errors ?? {}).flat().length;
                const details = placeFieldErrors(bodyRef.current?.closest('form'), e.errors ?? {});
                setError({ message: total > 0 && details.length === 0 ? 'Revisa los campos marcados' : e.message, details, inFields: details.length < total });
            } else {
                // Network failures and timeouts never reach the global toast on their own.
                setError({ message: CONNECTION_ERROR, details: [] });
                showNotification({ type: 'error', message: CONNECTION_ERROR });
            }
        } finally {
            busy.current = false;
            setSubmitting(false);
        }
    };

    const touch = (e: React.FormEvent<HTMLDivElement>) => {
        // The `input` that `validate` dispatches is not an edit.
        if (!e.nativeEvent.isTrusted) return;
        touched.current = true;
        // Editing a control drops the error it carried.
        if ('setCustomValidity' in e.target) (e.target as Control).setCustomValidity('');
    };

    /** Runs on the click that submits (Enter clicks the button too), before the browser validates the form. */
    const validate = () => {
        for (const el of controlsOf(bodyRef.current?.closest('form'))) {
            if (el.validity.customError) {
                // An API error never blocks sending again; the `input` makes the field drop the message.
                el.setCustomValidity('');
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // `required` alone accepts a value made of spaces.
            if ((el.type === 'text' || el.type === 'textarea') && el.required && el.value !== '' && el.value.trim() === '') el.setCustomValidity(REQUIRED);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={close}
            onSubmit={submit}
            title={title}
            icon={icon}
            variant="drawer"
            size={expanded ? 'screen' : size}
            headerActions={
                // On a phone the panel already fills the screen.
                <span className="hidden sm:inline-flex">
                    <IconButton icon={expanded ? Minimize2 : Maximize2} label={expanded ? 'Reducir' : 'Ampliar'} onClick={() => setExpanded((v) => !v)} />
                </span>
            }
            footer={<>
                <Button type="submit" isLoading={submitting} disabled={submitDisabled} onClick={validate}>{submitText}</Button>
                <Button variant="ghost" onClick={close} disabled={submitting}>Cancelar</Button>
                {footerExtra}
            </>}
        >
            <div ref={bodyRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6" onInput={touch} onChange={touch}>
                {error && (
                    <div
                        ref={alertRef}
                        role="alert"
                        tabIndex={-1}
                        className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/40 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                    >
                        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="font-semibold">No se pudo guardar</p>
                            <p className="break-words">{error.message}</p>
                            {error.details.length > 0 && (
                                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                                    {error.details.map((detail, i) => <li key={i} className="break-words">{detail}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
                {children}
            </div>
        </Modal>
    );
};

export interface FormSectionProps {
    title?: string;
    /** The fields: one column on a phone, two from `sm`. Wrap one in <div className="sm:col-span-2"> to span both. */
    children: React.ReactNode;
}

/** A group of fields with the grid every form shares. */
export const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
    <fieldset className="min-w-0">
        {title && <legend className="mb-3 text-sm font-bold text-slate-900 dark:text-white">{title}</legend>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
);
