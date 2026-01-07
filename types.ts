export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
}

export interface Project {
    id: string;
    name: string;
    client: string;
    status: 'In Progress' | 'Blocked' | 'Completed' | 'New';
    progress: number;
    initials: string;
    color: string;
}

export interface Opportunity {
    id: string;
    title: string;
    department: string;
    type: string;
    image: string;
    isNew?: boolean;
    isHot?: boolean;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}
