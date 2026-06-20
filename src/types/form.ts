// Form Builder type definitions matching the database schema

export type FieldType = 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';

export interface FormField {
  id: string;
  form_id: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
  created_at: string;
}

export interface Form {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormWithFields extends Form {
  fields: FormField[];
}

// Form data for create/edit operations
export interface FormData {
  id?: string;
  title: string;
  description: string;
  is_active: boolean;
}

// Field data for create/edit operations
export interface FormFieldData {
  id?: string;
  form_id?: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
}
