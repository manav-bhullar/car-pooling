import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DateTimePicker.css';

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DateTimePickerModal({ isOpen, onClose, onConfirm, initialDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [ampm, setAmpm] = useState('AM');

  useEffect(() => {
    if (isOpen) {
      const d = initialDate ? new Date(initialDate) : new Date();
      setSelectedDate(d);
      setCurrentDate(d);
      let h = d.getHours();
      const m = d.getMinutes();
      setAmpm(h >= 12 ? 'PM' : 'AM');
      h = h % 12 || 12;
      setHours(h.toString().padStart(2, '0'));
      setMinutes(m.toString().padStart(2, '0'));
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const daysInMonth = month === 1 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month];
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    let h = parseInt(hours, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    finalDate.setHours(h);
    finalDate.setMinutes(parseInt(minutes, 10));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    
    // Create local ISO string
    const tzOffset = finalDate.getTimezoneOffset() * 60000;
    const localIso = new Date(finalDate.getTime() - tzOffset).toISOString().slice(0, 16);
    onConfirm(localIso);
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    const now = new Date();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
      const isToday = now.getDate() === d && now.getMonth() === month && now.getFullYear() === year;
      
      days.push(
        <button 
          key={d} 
          type="button"
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
          onClick={() => setSelectedDate(new Date(year, month, d))}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return createPortal(
    <div className="modal-backdrop dt-backdrop" onClick={onClose}>
      <div className="modal expressive-calendar-modal" onClick={e => e.stopPropagation()}>
        <div className="calendar-header">
          <button type="button" className="icon-btn" onClick={handlePrevMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>
          </button>
          <h3>{monthNames[month]} {year}</h3>
          <button type="button" className="icon-btn" onClick={handleNextMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>
          </button>
        </div>

        <div className="calendar-grid days-of-week">
          {DAYS_OF_WEEK.map((day, i) => <div key={i}>{day}</div>)}
        </div>

        <div className="calendar-grid">
          {renderCalendar()}
        </div>

        <div className="time-picker-section">
          <div className="time-inputs">
            <div className="time-input-wrap">
              <input type="number" className="time-input" value={hours} onChange={e => setHours(e.target.value)} onBlur={e => setHours(e.target.value.padStart(2, '0'))} min="1" max="12" />
            </div>
            <span className="time-colon">:</span>
            <div className="time-input-wrap">
              <input type="number" className="time-input" value={minutes} onChange={e => setMinutes(e.target.value)} onBlur={e => setMinutes(e.target.value.padStart(2, '0'))} min="0" max="59" />
            </div>
          </div>
          <div className="ampm-toggle">
            <button type="button" className={`ampm-btn ${ampm === 'AM' ? 'active' : ''}`} onClick={() => setAmpm('AM')}>AM</button>
            <button type="button" className={`ampm-btn ${ampm === 'PM' ? 'active' : ''}`} onClick={() => setAmpm('PM')}>PM</button>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button type="button" className="btn btn-tonal" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>OK</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
