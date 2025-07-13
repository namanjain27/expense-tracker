export interface User {
    id: number;
    email: string;
    name: string | null;
    created_at: string;
    last_login: string | null;
}