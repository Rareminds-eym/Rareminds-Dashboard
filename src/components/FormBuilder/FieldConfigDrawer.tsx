import { useState, useEffect } from 'react';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import { FieldType, FormFieldData } from '../../types/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

interface FieldConfigDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (fieldData: FormFieldData) => void;
  existingField?: FormFieldData | null;
  existingFieldNames?: string[];
}

const FieldConfigDrawer = ({ 
  open, 
  onOpenChange, 
  onSave, 
  existingField,
  existingFieldNames = []
}: FieldConfigDrawerProps) => {
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [fieldNameManuallyEdited, setFieldNameManuallyEdited] = useState(false);

  // Load existing field data
  useEffect(() => {
    if (existingField) {
      setFieldLabel(existingField.field_label);
      setFieldName(existingField.field_name);
      setFieldType(existingField.field_type);
      setIsRequired(existingField.is_required);
      setOptions(existingField.options || []);
      setFieldNameManuallyEdited(true);
    } else {
      // Reset for new field
      setFieldLabel('');
      setFieldName('');
      setFieldType('text');
      setIsRequired(false);
      setOptions([]);
      setFieldNameManuallyEdited(false);
    }
  }, [existingField, open]);

  // Auto-generate field_name from field_label
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleFieldLabelChange = (value: string) => {
    setFieldLabel(value);
    if (!fieldNameManuallyEdited) {
      setFieldName(slugify(value));
    }
  };

  const handleFieldNameChange = (value: string) => {
    setFieldName(slugify(value));
    setFieldNameManuallyEdited(true);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    // Validation
    if (!fieldLabel.trim()) {
      alert('Field label is required');
      return;
    }

    if (!fieldName.trim()) {
      alert('Field name is required');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(fieldName)) {
      alert('Field name must be lowercase letters, numbers, and underscores only');
      return;
    }

    if (existingFieldNames.includes(fieldName)) {
      alert('This field name already exists. Please use a unique name.');
      return;
    }

    if (fieldType === 'select') {
      const validOptions = options.filter(opt => opt.trim() !== '');
      if (validOptions.length === 0) {
        alert('Select fields must have at least one option');
        return;
      }
    }

    const fieldData: FormFieldData = {
      field_label: fieldLabel,
      field_name: fieldName,
      field_type: fieldType,
      is_required: isRequired,
      options: fieldType === 'select' ? options.filter(opt => opt.trim() !== '') : null,
      sort_order: existingField?.sort_order || 0
    };

    onSave(fieldData);
    onOpenChange(false);
  };

  const fieldTypeOptions: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Dropdown (Select)' },
    { value: 'checkbox', label: 'Checkbox' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{existingField ? 'Edit Field' : 'Add New Field'}</SheetTitle>
          <SheetDescription>
            Configure the field settings and options
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Field Label */}
          <div>
            <Label htmlFor="field_label">Field Label *</Label>
            <Input
              id="field_label"
              value={fieldLabel}
              onChange={(e) => handleFieldLabelChange(e.target.value)}
              placeholder="e.g., First Name"
            />
            <p className="text-xs text-slate-500 mt-1">
              This is what users will see
            </p>
          </div>

          {/* Field Name */}
          <div>
            <Label htmlFor="field_name">Field Name (Internal Key) *</Label>
            <Input
              id="field_name"
              value={fieldName}
              onChange={(e) => handleFieldNameChange(e.target.value)}
              placeholder="e.g., first_name"
            />
            <p className="text-xs text-slate-500 mt-1">
              Lowercase, underscores only. Must be unique.
            </p>
          </div>

          {/* Field Type */}
          <div>
            <Label htmlFor="field_type">Field Type *</Label>
            <Select value={fieldType} onValueChange={(value) => setFieldType(value as FieldType)}>
              <SelectTrigger id="field_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_required">Required Field</Label>
              <p className="text-xs text-slate-500">
                Users must fill this field
              </p>
            </div>
            <Switch
              id="is_required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
          </div>

          {/* Options Editor (for select fields) */}
          {fieldType === 'select' && (
            <div>
              <Label>Dropdown Options *</Label>
              <p className="text-xs text-slate-500 mb-3">
                Add the options users can choose from
              </p>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={`option-${index}-${option || 'empty'}`} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {existingField ? 'Update' : 'Add'} Field
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FieldConfigDrawer;
