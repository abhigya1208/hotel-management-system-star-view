import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate, formatDateTime } from './helpers';

export const exportToPDF = (title, headers, rows, filename) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 107, 43);
  doc.text('Hotel Star View', 14, 16);
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(title, 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: rows,
    headStyles: { fillColor: [255, 107, 43], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 248, 245] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text('This site is created and maintained by Abhigya', 14, doc.internal.pageSize.height - 10);
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (sheetName, headers, rows, filename) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportBookingsPDF = (bookings, title = 'Bookings Report') => {
  const headers = ['Booking ID', 'Room', 'Guest', 'Phone', 'Check-In', 'Check-Out', 'Source', 'Total', 'Paid', 'Remaining', 'Status'];
  const rows = bookings.map(b => [
    b.bookingId,
    b.room?.roomNumber || b.roomNumber,
    b.guests?.[0]?.name || '—',
    b.guests?.[0]?.phone || '—',
    formatDate(b.checkIn),
    formatDate(b.checkOut),
    b.source,
    formatCurrency(b.totalAmount),
    formatCurrency(b.paidAmount),
    formatCurrency(b.remainingAmount),
    b.status,
  ]);
  exportToPDF(title, headers, rows, 'bookings-report');
};

export const exportBookingsExcel = (bookings, sheetName = 'Bookings') => {
  const headers = ['Booking ID', 'Room', 'Guest', 'Phone', 'Country', 'Check-In', 'Check-Out', 'Source', 'Total', 'Paid', 'Remaining', 'Mode', 'Status'];
  const rows = bookings.map(b => [
    b.bookingId,
    b.room?.roomNumber || b.roomNumber,
    b.guests?.[0]?.name || '—',
    b.guests?.[0]?.phone || '—',
    b.guests?.[0]?.country || '—',
    formatDate(b.checkIn),
    formatDate(b.checkOut),
    b.source,
    b.totalAmount,
    b.paidAmount,
    b.remainingAmount,
    b.paymentMode,
    b.status,
  ]);
  exportToExcel(sheetName, headers, rows, 'bookings-report');
};

export const exportExpensesPDF = (expenses, title = 'Expenses Report') => {
  const headers = ['Date', 'Category', 'Person', 'Amount', 'Mode', 'Description'];
  const rows = expenses.map(e => [
    formatDate(e.date),
    e.category,
    e.personName || '—',
    formatCurrency(e.amount),
    e.paymentMode,
    e.description || '—',
  ]);
  exportToPDF(title, headers, rows, 'expenses-report');
};

export const exportExpensesExcel = (expenses) => {
  const headers = ['Date', 'Category', 'Person', 'Amount', 'Mode', 'Description'];
  const rows = expenses.map(e => [formatDate(e.date), e.category, e.personName || '—', e.amount, e.paymentMode, e.description || '—']);
  exportToExcel('Expenses', headers, rows, 'expenses-report');
};
