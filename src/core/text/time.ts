// Clock time as the school writes it (docs/ZADANIA.md section 4): "15.00", "7.05".
export const formatTime = (hour: number, minute: number): string => `${hour}.${String(minute).padStart(2, '0')}`;
