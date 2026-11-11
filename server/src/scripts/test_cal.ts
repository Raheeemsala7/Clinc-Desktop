import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { AppointmentsService } from '../services/appointments.service';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const res = await AppointmentsService.getCalendarView({ date: '2026-11-11' }, { role: 'RECEPTION', id: 'test' });
  console.log('ALL DOCTORS:', JSON.stringify(res.allDoctors, null, 2));
  console.log('WEEK APPTS:', JSON.stringify(res.weekAppointments.map((a: any) => ({
    patientName: a.patientName,
    doctorName: a.doctorName,
    doctorId: a.doctorId,
    startTime: a.startTime,
    clinicDate: a.clinicDate
  })), null, 2));
  console.log('DAY SLOTS BOOKED:', JSON.stringify(res.daySlots.filter(s => s.isBooked).map(s => ({
    time: s.time,
    patient: s.appointment?.patientName,
    doctor: s.appointment?.doctorName,
    doctorId: s.appointment?.doctorId
  })), null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

