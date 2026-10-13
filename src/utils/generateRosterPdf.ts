import PDFDocument from 'pdfkit';
import { ALL_CLASS_SECTIONS, PRE_REGISTERED_STUDENTS } from '../data/studentCredentials.ts';
import { INITIAL_DATABASE } from '../data/seedDatabase.ts';

export interface GeneratePdfOptions {
  generatedDate?: string;
}

export function generateRosterPdf(options: GeneratePdfOptions = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: 'Scholars School & College - Teacher & Student Code Directory',
          Author: 'Scholars School & College Administration',
          Subject: 'Academic Credentials & Login Directory 2026',
          Keywords: 'SSC, Teachers, Students, Codes, Credentials'
        },
        bufferPages: true
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const totalPages = doc.bufferedPageRange().count;
        // Loop over pages to write footer page numbers
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#64748B');
          doc.text(
            `Scholars School & College · Official Directory 2026 · Confidential · Page ${i + 1} of ${totalPages}`,
            36,
            doc.page.height - 24,
            { align: 'center', width: doc.page.width - 72 }
          );
        }
        resolve(Buffer.concat(buffers));
      });

      const pageWidth = doc.page.width - 72;
      const dateStr = options.generatedDate || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // ==========================================
      // PAGE 1: COVER & TEACHERS / LEADERSHIP
      // ==========================================

      // Top Decorative Banner
      doc.rect(36, 36, pageWidth, 64).fill('#0F172A');
      doc.rect(36, 96, pageWidth, 4).fill('#38BDF8');

      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold');
      doc.text('SCHOLARS SCHOOL & COLLEGE', 50, 48);

      doc.fillColor('#94A3B8').fontSize(9).font('Helvetica');
      doc.text('OFFICIAL ACADEMIC CREDENTIALS & LOGIN DIRECTORY (2026)', 50, 68);
      doc.text(`Generated: ${dateStr} · Academic Year 2026`, 50, 80);

      let currentY = 118;

      // Notice Box
      doc.rect(36, currentY, pageWidth, 28).fill('#F1F5F9');
      doc.rect(36, currentY, 3, 28).fill('#0284C7');
      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold');
      doc.text('OFFICIAL ACCESS NOTICE:', 46, currentY + 6);
      doc.fillColor('#475569').fontSize(8).font('Helvetica');
      doc.text('This document contains authorized login codes for Faculty, Executive Leadership, and Students.', 46, currentY + 16);

      currentY += 40;

      // ------------------------------------------
      // 1. EXECUTIVE LEADERSHIP ACCOUNTS
      // ------------------------------------------
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold');
      doc.text('1. EXECUTIVE LEADERSHIP ACCOUNTS', 36, currentY);
      currentY += 16;

      const leaders = [
        { role: 'Chairman', name: 'Shanaz Huda', code: '111111', email: 'chairman@scholars.edu.bd', room: 'Boardroom 501' },
        { role: 'Chief Advisor', name: 'Md Abul Kasem', code: '222222', email: 'chief.advisor@scholars.edu.bd', room: 'Advisory Suite 502' },
        { role: 'Principal', name: 'Md Abul Hannan', code: '333333', email: 'principal@scholars.edu.bd', room: 'Principal Office 503' }
      ];

      // Table Header
      doc.rect(36, currentY, pageWidth, 18).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('LOGIN CODE', 42, currentY + 5, { width: 70 });
      doc.text('EXECUTIVE OFFICER', 115, currentY + 5, { width: 130 });
      doc.text('DESIGNATION', 250, currentY + 5, { width: 110 });
      doc.text('OFFICIAL EMAIL', 365, currentY + 5, { width: 155 });
      currentY += 18;

      leaders.forEach((lead, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(36, currentY, pageWidth, 17).fill(bg);
        doc.rect(36, currentY, pageWidth, 17).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.fillColor('#0284C7').fontSize(8.5).font('Helvetica-Bold');
        doc.text(lead.code, 42, currentY + 4, { width: 70 });

        doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold');
        doc.text(lead.name, 115, currentY + 4, { width: 130 });

        doc.fillColor('#334155').fontSize(8).font('Helvetica');
        doc.text(lead.role, 250, currentY + 4, { width: 110 });
        doc.text(lead.email, 365, currentY + 4, { width: 155 });
        currentY += 17;
      });

      currentY += 16;

      // ------------------------------------------
      // 2. FACULTY & TEACHERS DIRECTORY
      // ------------------------------------------
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold');
      doc.text('2. FACULTY & TEACHERS DIRECTORY (12 TEACHERS)', 36, currentY);
      currentY += 16;

      const teachers = INITIAL_DATABASE.teachers.map((t) => {
        const u = INITIAL_DATABASE.users.find((usr) => usr.id === t.user_id);
        return {
          code: u?.teacherCode || t.employee_id.replace('EMP-SSC-', ''),
          name: u?.name || 'Teacher',
          subject: t.authorizedSubjects.join(', '),
          dept: t.department.replace('Department of ', ''),
          classTeacherOf: t.classTeacherOf || 'Subject Faculty'
        };
      });

      // Teachers Table Header
      doc.rect(36, currentY, pageWidth, 18).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('CODE', 42, currentY + 5, { width: 50 });
      doc.text('TEACHER NAME', 95, currentY + 5, { width: 135 });
      doc.text('SUBJECT', 235, currentY + 5, { width: 75 });
      doc.text('DEPARTMENT', 315, currentY + 5, { width: 105 });
      doc.text('CLASS TEACHER ASSIGNMENT', 425, currentY + 5, { width: 95 });
      currentY += 18;

      teachers.forEach((tch, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(36, currentY, pageWidth, 18).fill(bg);
        doc.rect(36, currentY, pageWidth, 18).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.fillColor('#0284C7').fontSize(8.5).font('Helvetica-Bold');
        doc.text(tch.code, 42, currentY + 4, { width: 50 });

        doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica-Bold');
        doc.text(tch.name, 95, currentY + 4, { width: 135 });

        // Highlight Higher Math for MD Shahidul Islam
        const isHigherMath = tch.subject.includes('Higher Math');
        doc.fillColor(isHigherMath ? '#D97706' : '#2563EB').fontSize(7.5).font(isHigherMath ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(tch.subject, 235, currentY + 4, { width: 75 });

        doc.fillColor('#475569').fontSize(7).font('Helvetica');
        doc.text(tch.dept, 315, currentY + 4, { width: 105 });

        doc.fillColor('#059669').fontSize(7.5).font('Helvetica-Bold');
        doc.text(tch.classTeacherOf, 425, currentY + 4, { width: 95 });

        currentY += 18;
      });

      // ==========================================
      // PAGES 2+: STUDENT DIRECTORY BY SECTION
      // ==========================================
      // We will group students by class & section config
      ALL_CLASS_SECTIONS.forEach((clsSec, sectionIdx) => {
        doc.addPage();

        // Section Page Header
        doc.rect(36, 36, pageWidth, 38).fill('#0F172A');
        doc.rect(36, 72, pageWidth, 3).fill('#10B981');

        const sectionStudents = PRE_REGISTERED_STUDENTS.filter(
          (s) => s.className === clsSec.className && s.code.startsWith(clsSec.codePrefix)
        );

        const assignedTeacher = INITIAL_DATABASE.teachers.find((t) => t.id === clsSec.teacherId);
        const assignedTeacherUser = INITIAL_DATABASE.users.find((u) => u.id === assignedTeacher?.user_id);

        doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold');
        doc.text(`${clsSec.className.toUpperCase()} — SECTION ${clsSec.section.toUpperCase()}`, 48, 44);

        doc.fillColor('#94A3B8').fontSize(8).font('Helvetica');
        doc.text(
          `Class Teacher: ${assignedTeacherUser?.name || 'Class Teacher'} (${assignedTeacher?.authorizedSubjects.join(', ')}) [Code: ${assignedTeacherUser?.teacherCode}] · Room: ${clsSec.room}`,
          48,
          59
        );

        let secY = 88;

        // Note if transferred cohort
        if (clsSec.codePrefix === '90' || clsSec.codePrefix === '12') {
          doc.rect(36, secY, pageWidth, 18).fill('#FEF3C7');
          doc.fillColor('#92400E').fontSize(7.5).font('Helvetica-Bold');
          doc.text(
            '★ OFFICIAL NOTE: Students of this cohort have been officially transferred to Section BS1 with Class Teacher MD SHAHIDUL ISLAM (Higher Math).',
            44,
            secY + 5
          );
          secY += 24;
        }

        // Two-column roster layout
        // Left Column: Rolls 1 to 18
        // Right Column: Rolls 19 to 35
        const leftColStudents = sectionStudents.filter((s) => s.roll <= 18);
        const rightColStudents = sectionStudents.filter((s) => s.roll > 18);

        const colWidth = (pageWidth - 12) / 2;

        const renderStudentTable = (startX: number, studentsSubset: typeof sectionStudents) => {
          let rowY = secY;

          // Header
          doc.rect(startX, rowY, colWidth, 16).fill('#1E293B');
          doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
          doc.text('ROLL', startX + 6, rowY + 4, { width: 30 });
          doc.text('CODE', startX + 38, rowY + 4, { width: 45 });
          doc.text('STUDENT FULL NAME', startX + 85, rowY + 4, { width: colWidth - 90 });
          rowY += 16;

          studentsSubset.forEach((st, idx) => {
            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            doc.rect(startX, rowY, colWidth, 18).fill(bg);
            doc.rect(startX, rowY, colWidth, 18).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

            // Roll
            doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
            doc.text(String(st.roll).padStart(2, '0'), startX + 6, rowY + 5, { width: 30 });

            // Code
            doc.fillColor('#0284C7').fontSize(8).font('Helvetica-Bold');
            doc.text(st.code, startX + 38, rowY + 5, { width: 45 });

            // Name
            doc.fillColor('#0F172A').fontSize(7.5).font('Helvetica');
            doc.text(st.name, startX + 85, rowY + 5, { width: colWidth - 90, lineBreak: false });

            rowY += 18;
          });
        };

        renderStudentTable(36, leftColStudents);
        renderStudentTable(36 + colWidth + 12, rightColStudents);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
