import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown } from 'lucide-react';

interface ClassSheet {
  id: string;
  className: string;
  recordsCount: number;
}

export function ClassSelector() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSheet[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadClasses();
  }, [user?.uid]);

  const loadClasses = () => {
    const sheets: ClassSheet[] = JSON.parse(
      localStorage.getItem(`class_sheets_${user?.uid}`) || '[]'
    );
    setClasses(sheets);

    const saved = localStorage.getItem('current_selected_class');
    if (saved && sheets.find(s => s.id === saved)) {
      setSelectedClass(saved);
    } else if (sheets.length > 0) {
      setSelectedClass(sheets[0].id);
      localStorage.setItem('current_selected_class', sheets[0].id);
    }
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClass(classId);
    localStorage.setItem('current_selected_class', classId);
    setIsOpen(false);
    // Reload page to refresh data
    window.location.reload();
  };

  const selectedClassData = classes.find(c => c.id === selectedClass);

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
        📚 {selectedClassData?.className || 'Select Class'}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => handleSelectClass(cls.id)}
              className={`w-full text-left px-4 py-2 hover:bg-slate-100 transition ${
                selectedClass === cls.id ? 'bg-blue-50 font-semibold' : ''
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