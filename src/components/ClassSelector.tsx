import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClass } from '@/context/ClassContext';
import { ChevronDown, Loader } from 'lucide-react';

export function ClassSelector() {
  const { classes, selectedClass, changeClass, itemsLoading: loading } = useClass();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectClass = (classId: string) => {
    changeClass(classId);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader className="w-3 h-3 mr-2 animate-spin" /> Loading classes...
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No classes added yet. Go to Sync Data to add a class.
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedClass?.className || 'Select Class'}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg shadow-lg z-50">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => handleSelectClass(cls.id)}
              className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${selectedClass?.id === cls.id ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''
                }`}
            >
              <p className="font-medium">{cls.className}</p>
              <p className="text-xs text-muted-foreground">{cls.recordsCount} records</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}