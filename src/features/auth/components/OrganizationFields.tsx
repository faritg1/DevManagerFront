import React from 'react';
import { Building2, Mail, User } from 'lucide-react';
import type { RegisterOrganizationRequest } from '../../../shared/api';
import { Input, Select } from '../../../shared/ui';
import { ENTITY_TYPES } from '../../associates/labels';

/** What the form holds: every field of the request as the text typed. */
export type OrganizationForm = Record<keyof RegisterOrganizationRequest, string>;

export const EMPTY_ORGANIZATION: OrganizationForm = {
    organizationName: '', legalName: '', nit: '', entityType: '', firstName: '', lastName: '', email: '', phone: '', password: '',
};

/** The request body: optional fields left empty are not sent. */
export const toOrganizationRequest = (form: OrganizationForm): RegisterOrganizationRequest => ({
    organizationName: form.organizationName.trim(),
    legalName: form.legalName.trim() || undefined,
    nit: form.nit.trim() || undefined,
    entityType: form.entityType ? Number(form.entityType) : undefined,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    password: form.password,
});

interface Props {
    value: OrganizationForm;
    onChange: (value: OrganizationForm) => void;
    passwordError?: string;
}

/** The organization and its first administrator: shared by the public register and the platform dialog. */
export const OrganizationFields: React.FC<Props> = ({ value, onChange, passwordError }) => {
    const field = (name: keyof OrganizationForm) => ({
        name,
        value: value[name],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [name]: e.target.value }),
    });

    return (
        <>
            <Input label="Nombre de la Organización" placeholder="Mi Empresa S.A.S" icon={Building2} required {...field('organizationName')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Razón social (opcional)" {...field('legalName')} />
                <Input label="NIT (opcional)" {...field('nit')} />
            </div>
            <Select label="Tipo de entidad (opcional)" {...field('entityType')}>
                <option value="">No especificar</option>
                {Object.entries(ENTITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Nombre" placeholder="Juan" icon={User} autoComplete="given-name" required {...field('firstName')} />
                <Input label="Apellido" placeholder="Pérez" autoComplete="family-name" required {...field('lastName')} />
            </div>
            <Input label="Email Corporativo" type="email" autoComplete="email" placeholder="juan@empresa.com" icon={Mail} required {...field('email')} />
            <Input label="Teléfono (opcional)" type="tel" autoComplete="tel" {...field('phone')} />
            <Input label="Contraseña" type="password" autoComplete="new-password" placeholder="••••••••" error={passwordError} required {...field('password')} />
        </>
    );
};
