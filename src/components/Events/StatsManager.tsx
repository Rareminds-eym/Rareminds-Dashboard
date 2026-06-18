import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Plus, Trash2, X, Edit3, BarChart2 } from 'lucide-react';
import { Label } from '../ui/label';
import { StatItem } from '../../types/event';

interface StatsManagerProps {
  stats: StatItem[];
  onChange: (stats: StatItem[]) => void;
  disabled?: boolean;
  maxStats?: number;
}

export const StatsManager: React.FC<StatsManagerProps> = ({
  stats,
  onChange,
  disabled = false,
  maxStats = 8,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editLabel, setEditLabel] = useState('');

  const canAddMore = stats.length < maxStats;

  const handleAdd = () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    onChange([...stats, { value: newValue.trim(), label: newLabel.trim() }]);
    setNewValue('');
    setNewLabel('');
    setIsAdding(false);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(stats[index].value);
    setEditLabel(stats[index].label);
  };

  const handleSaveEdit = (index: number) => {
    if (!editValue.trim() || !editLabel.trim()) return;
    const updated = stats.map((s, i) =>
      i === index ? { ...s, value: editValue.trim(), label: editLabel.trim() } : s
    );
    onChange(updated);
    setEditingIndex(null);
  };

  const handleRemove = (index: number) => {
    onChange(stats.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); action(); }
    if (e.key === 'Escape') { e.preventDefault(); setIsAdding(false); setEditingIndex(null); }
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Stat button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Stats</h3>
        {!isAdding && canAddMore && stats.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Stat
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <Card className="border-2 border-dashed border-teal-300 bg-teal-50/50">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium text-slate-700">New Stat</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Value</Label>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleAdd)}
                  placeholder="e.g. 150K+"
                  className="border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleAdd)}
                  placeholder="e.g. Educators Trained"
                  className="border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setIsAdding(false); setNewValue(''); setNewLabel(''); }}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={disabled || !newValue.trim() || !newLabel.trim()}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4" />
                Add Stat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {stats.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Added Stats ({stats.length})</Label>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {editingIndex === index ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Value</Label>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(index))}
                        className="border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Label</Label>
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(index))}
                        className="border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingIndex(null)}
                      disabled={disabled}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveEdit(index)}
                      disabled={disabled || !editValue.trim() || !editLabel.trim()}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Edit3 className="w-4 h-4" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
                      <BarChart2 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {stats.length === 0 && !isAdding && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-teal-100 rounded-full">
                <BarChart2 className="h-8 w-8 text-teal-500" />
              </div>
              <div>
                <p className="text-gray-500 mb-2">No stats added yet</p>
                <p className="text-sm text-gray-400 mb-4">Add numbers that showcase your event's impact</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(true)}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Stat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.length >= maxStats && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">Maximum number of stats reached ({maxStats}/{maxStats})</p>
        </div>
      )}
    </div>
  );
};
