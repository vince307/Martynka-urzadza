// Clock time as the school writes it (docs/ZADANIA.md section 4): "15.00", "7.05".
export const formatTime = (hour: number, minute: number): string => `${hour}.${String(minute).padStart(2, '0')}`;

/** The narrator reads "8 15" as a time, "8.15" as a decimal. */
export const spokenTime = (hour: number, minute: number): string => (minute === 0 ? String(hour) : `${hour} ${String(minute).padStart(2, '0')}`);
