type Student = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subjects: string[]
    status: "active" | "inactive" | "archived"
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}