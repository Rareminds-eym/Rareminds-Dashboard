import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, GripVertical, Edit2, Trash2 } from 'lucide-react';
import { useForms } from '../../hooks/useForms';
import { FormFieldData, FieldType, FormWithFields } from '../../types/form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FieldConfigDrawer from '../../components/FormBuilder/FieldConfigDrawer';
import FormPreview from '../../components/FormBuilder/FormPreview';

interface LocalFormField extends FormFieldData {
  id: string;
  temp?: boolean;
}

// Sortable Field Card Component
const SortableField = ({ 
  field, 
  onEdit, 
  onDelete 
}: { 
  field: LocalFormField; 
  onEdit: () => void; 
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFieldTypeColor = (type: FieldType) => {
    const colors = {
      text: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      email: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      tel: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      select: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      textarea: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      checkbox: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    };
    return colors[type] || colors.text;
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {field.field_label}
              </span>
              {field.is_required && (
                <span className="text-red-500 text-xs font-semibold">Required</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getFieldTypeColor(field.field_type)}`}>
                {field.field_type}
              </span>
              <span className="text-xs">({field.field_name})</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!formId;

  const { 
    createForm, 
    updateForm, 
    getFormById, 
    createFormField, 
    updateFormField, 
    deleteFormField, 
    reorderFormFields,
    loading 
  } = useForms();

  // Form metadata state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Fields state
  const [fields, setFields] = useState<LocalFormField[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingField, setEditingField] = useState<LocalFormField | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load form data in edit mode
  useEffect(() => {
    if (isEditMode && formId) {
      loadFormData();
    }
  }, [formId, isEditMode]);

  const loadFormData = async () => {
    if (!formId) return;
    const formData = await getFormById(formId);
    if (formData) {
      setTitle(formData.title);
      setDescription(formData.description || '');
      setIsActive(formData.is_active);
      setFields(formData.fields.map(f => ({ ...f, temp: false })));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Update sort_order for each field
        return newOrder.map((field, index) => ({
          ...field,
          sort_order: index
        }));
      });
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setDrawerOpen(true);
  };

  const handleEditField = (field: LocalFormField) => {
    setEditingField(field);
    setDrawerOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      setFields(prev => prev.filter(f => f.id !== fieldId));
    }
  };

  const handleSaveField = (fieldData: FormFieldData) => {
    if (editingField) {
      // Update existing field
      setFields(prev => prev.map(f => 
        f.id === editingField.id 
          ? { ...fieldData, id: f.id, form_id: f.form_id, temp: f.temp }
          : f
      ));
    } else {
      // Add new field
      const newField: LocalFormField = {
        ...fieldData,
        id: `temp_${Date.now()}`,
        form_id: formId,
        sort_order: fields.length,
        temp: true
      };
      setFields(prev => [...prev, newField]);
    }
    setDrawerOpen(false);
    setEditingField(null);
  };

  const handleSaveForm = async () => {
    if (!title.trim()) {
      alert('Please enter a form title');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field to the form');
      return;
    }

    // Check for duplicate field names
    const fieldNames = fields.map(f => f.field_name);
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      alert(`Duplicate field names found: ${duplicates.join(', ')}. Each field must have a unique name.`);
      return;
    }

    try {
      let currentFormId = formId;

      // Create or update form
      if (isEditMode && formId) {
        await updateForm(formId, { title, description, is_active: isActive });
      } else {
        const newForm = await createForm({ title, description, is_active: isActive });
        if (!newForm) return;
        currentFormId = newForm.id;
      }

      if (!currentFormId) return;

      // Separate new and existing fields
      const newFields = fields.filter(f => f.temp);
      const existingFields = fields.filter(f => !f.temp);

      // Update existing fields first
      for (const field of existingFields) {
        // Only pass the updatable fields, exclude id, form_id, temp, created_at
        await updateFormField(field.id, {
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required,
          options: field.options,
          sort_order: field.sort_order
        });
      }

      // Create new fields
      for (const field of newFields) {
        await createFormField({ ...field, form_id: currentFormId });
      }

      // Reload the form to get the updated field IDs, then reorder all
      const updatedForm = await getFormById(currentFormId);
      if (updatedForm && updatedForm.fields.length > 0) {
        // Build ordered list based on sort_order
        const orderedIds = updatedForm.fields
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(f => f.id);
        await reorderFormFields(currentFormId, orderedIds);
      }

      navigate('/form-builder');
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  const handleCancel = () => {
    if (confirm('Discard unsaved changes?')) {
      navigate('/form-builder');
    }
  };

  if (loading && isEditMode && fields.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/form-builder')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Form' : 'Create New Form'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Design your custom registration form
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSaveForm}>
            <Save className="h-4 w-4 mr-2" />
            Save Form
          </Button>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Form Builder */}
        <div className="space-y-6">
          {/* Form Metadata */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Form Settings
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Workshop Registration"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this form"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Only active forms can be attached to events
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </Card>

          {/* Fields List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Form Fields ({fields.length})
              </h2>
              <Button onClick={handleAddField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p>No fields yet. Click "Add Field" to get started.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {fields.map(field => (
                      <SortableField
                        key={field.id}
                        field={field}
                        onEdit={() => handleEditField(field)}
                        onDelete={() => handleDeleteField(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Card>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Live Preview
            </h2>
            <FormPreview
              title={title || 'Untitled Form'}
              description={description}
              fields={fields}
            />
          </Card>
        </div>
      </div>

      {/* Field Config Drawer */}
      <FieldConfigDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveField}
        existingField={editingField}
        existingFieldNames={fields.filter(f => f.id !== editingField?.id).map(f => f.field_name)}
      />
    </div>
  );
};

export default FormBuilderPage;
