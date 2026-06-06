import React, { useState } from 'react';
import { FeatureItem } from '../../types/event';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Edit2, Save, X, Zap } from 'lucide-react';

interface FeaturesManagerProps {
  features: FeatureItem[];
  onChange: (features: FeatureItem[]) => void;
  disabled?: boolean;
}

interface EditingFeature extends FeatureItem {
  index: number;
}

export const FeaturesManager: React.FC<FeaturesManagerProps> = ({
  features,
  onChange,
  disabled = false,
}) => {
  const [editingFeature, setEditingFeature] = useState<EditingFeature | null>(null);
  const [newFeature, setNewFeature] = useState<FeatureItem>({ title: '', description: '', icon: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleAdd = () => {
    if (newFeature.title.trim() && newFeature.description.trim()) {
      onChange([...features, { ...newFeature, icon: newFeature.icon?.trim() || null }]);
      setNewFeature({ title: '', description: '', icon: '' });
      setIsAddingNew(false);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingFeature({ ...features[index], index });
  };

  const handleSaveEdit = () => {
    if (!editingFeature || !editingFeature.title.trim() || !editingFeature.description.trim()) return;
    const updated = [...features];
    updated[editingFeature.index] = {
      title: editingFeature.title,
      description: editingFeature.description,
      icon: editingFeature.icon?.trim() || null,
    };
    onChange(updated);
    setEditingFeature(null);
  };

  const handleDelete = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  const handleCancelAdd = () => {
    setNewFeature({ title: '', description: '', icon: '' });
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Features</h3>
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
            Add Feature
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAddingNew && (
        <Card className="border-2 border-dashed border-violet-300 bg-violet-50/50">
          <CardHeader>
            <CardTitle className="text-sm">Add New Feature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                value={newFeature.title}
                onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Live Q&A Sessions"
                disabled={disabled}
                className="border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <Textarea
                value={newFeature.description}
                onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this feature..."
                rows={3}
                disabled={disabled}
                className="border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Icon <span className="text-slate-400 font-normal">(optional — emoji or icon name)</span>
              </label>
              <Input
                value={newFeature.icon || ''}
                onChange={(e) => setNewFeature(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="e.g. 🎯 or mic"
                disabled={disabled}
                className="border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={disabled || !newFeature.title.trim() || !newFeature.description.trim()}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Save className="h-4 w-4" />
                Add Feature
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {features.length > 0 && (
        <div className="space-y-3">
          {features.map((feature, index) => (
            <Card key={index} className="relative">
              {editingFeature?.index === index ? (
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <Input
                      value={editingFeature.title}
                      onChange={(e) => setEditingFeature(prev => prev ? { ...prev, title: e.target.value } : null)}
                      disabled={disabled}
                      className="border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <Textarea
                      value={editingFeature.description}
                      onChange={(e) => setEditingFeature(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={3}
                      disabled={disabled}
                      className="border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Icon <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <Input
                      value={editingFeature.icon || ''}
                      onChange={(e) => setEditingFeature(prev => prev ? { ...prev, icon: e.target.value } : null)}
                      placeholder="e.g. 🎯 or mic"
                      disabled={disabled}
                      className="border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFeature(null)}
                      disabled={disabled}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={disabled || !editingFeature.title.trim() || !editingFeature.description.trim()}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-violet-100 rounded-lg flex-shrink-0 mt-0.5">
                        {feature.icon ? (
                          <span className="text-base leading-none">{feature.icon}</span>
                        ) : (
                          <Zap className="w-4 h-4 text-violet-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">{feature.title}</h4>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">{feature.description}</p>
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
      {features.length === 0 && !isAddingNew && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-violet-100 rounded-full">
                <Zap className="h-8 w-8 text-violet-500" />
              </div>
              <div>
                <p className="text-gray-500 mb-2">No features added yet</p>
                <p className="text-sm text-gray-400 mb-4">Highlight what attendees will get from your event</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingNew(true)}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Feature
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
