import React, { useState } from 'react';
import { TestimonialItem } from '../../types/event';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Edit2, Save, X, Quote } from 'lucide-react';

interface TestimonialsManagerProps {
  testimonials: TestimonialItem[];
  onChange: (testimonials: TestimonialItem[]) => void;
  disabled?: boolean;
}

interface EditingTestimonial extends TestimonialItem {
  index: number;
}

const emptyTestimonial = (): TestimonialItem => ({
  name: '',
  designation: '',
  school: '',
  location: '',
  rating: 5,
  review: '',
  photo: '',
});

const RATING_OPTIONS = [1, 2, 3, 4, 5];

interface TestimonialFormProps {
  value: TestimonialItem;
  onChange: (t: TestimonialItem) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  saveDisabled: boolean;
  disabled: boolean;
}

const TestimonialForm: React.FC<TestimonialFormProps> = ({
  value,
  onChange: onFormChange,
  onSave,
  onCancel,
  saveLabel,
  saveDisabled,
  disabled,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name *</label>
        <Input
          value={value.name}
          onChange={(e) => onFormChange({ ...value, name: e.target.value })}
          placeholder="e.g. Priya Sharma"
          disabled={disabled}
          className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Designation <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <Input
          value={value.designation || ''}
          onChange={(e) => onFormChange({ ...value, designation: e.target.value })}
          placeholder="e.g. Senior Teacher"
          disabled={disabled}
          className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          School <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <Input
          value={value.school || ''}
          onChange={(e) => onFormChange({ ...value, school: e.target.value })}
          placeholder="e.g. Delhi Public School"
          disabled={disabled}
          className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Location <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <Input
          value={value.location || ''}
          onChange={(e) => onFormChange({ ...value, location: e.target.value })}
          placeholder="e.g. New Delhi"
          disabled={disabled}
          className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">
        Rating <span className="text-slate-400 font-normal">(optional)</span>
      </label>
      <div className="flex gap-2">
        {RATING_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            title={`${r} star${r > 1 ? 's' : ''}`}
            disabled={disabled}
            onClick={() => onFormChange({ ...value, rating: r })}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
              value.rating === r
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Review *</label>
      <Textarea
        value={value.review}
        onChange={(e) => onFormChange({ ...value, review: e.target.value })}
        placeholder="What they said about the event..."
        rows={3}
        disabled={disabled}
        className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">
        Photo URL <span className="text-slate-400 font-normal">(optional)</span>
      </label>
      <Input
        value={value.photo || ''}
        onChange={(e) => onFormChange({ ...value, photo: e.target.value })}
        placeholder="https://..."
        disabled={disabled}
        className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
      />
    </div>
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancel}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <X className="h-4 w-4" />
        Cancel
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={onSave}
        disabled={saveDisabled}
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
      >
        <Save className="h-4 w-4" />
        {saveLabel}
      </Button>
    </div>
  </div>
);

export const TestimonialsManager: React.FC<TestimonialsManagerProps> = ({
  testimonials,
  onChange,
  disabled = false,
}) => {
  const [editingTestimonial, setEditingTestimonial] = useState<EditingTestimonial | null>(null);
  const [newTestimonial, setNewTestimonial] = useState<TestimonialItem>(emptyTestimonial());
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleAdd = () => {
    if (newTestimonial.name.trim() && newTestimonial.review.trim()) {
      onChange([...testimonials, {
        name: newTestimonial.name.trim(),
        designation: newTestimonial.designation?.trim() || null,
        school: newTestimonial.school?.trim() || null,
        location: newTestimonial.location?.trim() || null,
        rating: newTestimonial.rating ?? null,
        review: newTestimonial.review.trim(),
        photo: newTestimonial.photo?.trim() || null,
      }]);
      setNewTestimonial(emptyTestimonial());
      setIsAddingNew(false);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingTestimonial({ ...testimonials[index], index });
  };

  const handleSaveEdit = () => {
    if (!editingTestimonial || !editingTestimonial.name.trim() || !editingTestimonial.review.trim()) return;
    const updated = [...testimonials];
    updated[editingTestimonial.index] = {
      name: editingTestimonial.name.trim(),
      designation: editingTestimonial.designation?.trim() || null,
      school: editingTestimonial.school?.trim() || null,
      location: editingTestimonial.location?.trim() || null,
      rating: editingTestimonial.rating ?? null,
      review: editingTestimonial.review.trim(),
      photo: editingTestimonial.photo?.trim() || null,
    };
    onChange(updated);
    setEditingTestimonial(null);
  };

  const handleDelete = (index: number) => {
    onChange(testimonials.filter((_, i) => i !== index));
  };

  const handleCancelAdd = () => {
    setNewTestimonial(emptyTestimonial());
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Testimonials</h3>
        {!isAddingNew && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Testimonial
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAddingNew && (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-sm">Add New Testimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <TestimonialForm
              value={newTestimonial}
              onChange={setNewTestimonial}
              onSave={handleAdd}
              onCancel={handleCancelAdd}
              saveLabel="Add Testimonial"
              saveDisabled={disabled || !newTestimonial.name.trim() || !newTestimonial.review.trim()}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}

      {/* List */}
      {testimonials.length > 0 && (
        <div className="space-y-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative">
              {editingTestimonial?.index === index ? (
                <CardContent className="p-4">
                  <TestimonialForm
                    value={editingTestimonial}
                    onChange={(t) => setEditingTestimonial({ ...t, index })}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingTestimonial(null)}
                    saveLabel="Save"
                    saveDisabled={disabled || !editingTestimonial.name.trim() || !editingTestimonial.review.trim()}
                    disabled={disabled}
                  />
                </CardContent>
              ) : (
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {testimonial.photo ? (
                        <img
                          src={testimonial.photo}
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-700 font-semibold text-sm">
                            {testimonial.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <Quote className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          {testimonial.rating && (
                            <span className="text-xs text-amber-600 font-medium ml-1">
                              {'★'.repeat(testimonial.rating)}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 text-sm italic mb-2">"{testimonial.review}"</p>
                        <p className="font-semibold text-slate-800 text-sm">{testimonial.name}</p>
                        {testimonial.designation && (
                          <p className="text-slate-500 text-xs">{testimonial.designation}</p>
                        )}
                        {(testimonial.school || testimonial.location) && (
                          <p className="text-slate-400 text-xs">
                            {[testimonial.school, testimonial.location].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(index)}
                        disabled={disabled}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {testimonials.length === 0 && !isAddingNew && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-100 rounded-full">
                <Quote className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <p className="text-gray-500 mb-2">No testimonials added yet</p>
                <p className="text-sm text-gray-400 mb-4">Add quotes from past attendees to build trust</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingNew(true)}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Testimonial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
