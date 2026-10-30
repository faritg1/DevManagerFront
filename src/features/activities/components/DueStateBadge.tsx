import React from 'react';
import type { MyWorkItemResponse } from '../../../shared/api';
import { Badge } from '../../../shared/ui';

/** "Vencida" / "Por vencer" from the API's due state (same business-day rule as the notifier). */
export const DueStateBadge: React.FC<{ state: MyWorkItemResponse['dueState'] }> = ({ state }) =>
    state === 'Overdue' ? <Badge variant="danger">Vencida</Badge>
        : state === 'DueSoon' ? <Badge variant="warning">Por vencer</Badge>
            : null;

/** Detail drawer of an item on its project's activities page. */
export const workItemLink = (i: { projectId: string; id: string }) => `/activities/${i.projectId}?item=${i.id}`;
