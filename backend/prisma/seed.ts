import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const daysFrom = (offset: number, hours = 18, minutes = 30): Date => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

async function main() {
  // ── Direction & Teacher ──────────────────────────────────────────────
  const direction = await prisma.direction.upsert({
    where: { id: "dir-english" },
    update: {},
    create: { id: "dir-english", name: "Ingliz tili", color: "#3B82F6" },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@asmo.uz" },
    update: {},
    create: {
      email: "teacher@asmo.uz",
      passwordHash: await bcrypt.hash("password123", 10),
      firstName: "Dilnoza",
      lastName: "Rahimova",
      role: "TEACHER",
      status: "ACTIVE",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dilnoza",
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { id: "tch-001" },
    update: {},
    create: {
      id: "tch-001",
      userId: teacherUser.id,
      fullName: "Dilnoza Rahimova",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dilnoza",
    },
  });

  // Dedicated teacher login. Public /auth/register can only create STUDENT
  // accounts, so this is the one way to get a TEACHER session outside of an
  // existing teacher/admin adding one via POST /teachers.
  const bekjonUser = await prisma.user.upsert({
    where: { email: "bekjon@gmail.com" },
    update: {},
    create: {
      email: "bekjon@gmail.com",
      passwordHash: await bcrypt.hash("parol12345", 10),
      firstName: "Bekjon",
      lastName: "O'qituvchi",
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  await prisma.teacher.upsert({
    where: { id: "tch-bekjon" },
    update: {},
    create: {
      id: "tch-bekjon",
      userId: bekjonUser.id,
      fullName: "Bekjon O'qituvchi",
    },
  });

  // ── Group ────────────────────────────────────────────────────────────
  const group = await prisma.group.upsert({
    where: { id: "grp-ielts-01" },
    update: {},
    create: {
      id: "grp-ielts-01",
      name: "IELTS 6.5+",
      courseName: "IELTS Preparation",
      directionId: direction.id,
      teacherId: teacher.id,
      maxStudents: 15,
      scheduleDays: "Dushanba,Chorshanba,Juma",
      scheduleTime: "18:30",
      status: "ACTIVE",
    },
  });

  // ── Demo student (primary login) + a few peers for the leaderboard ──
  const passwordHash = await bcrypt.hash("password123", 10);

  const student = await prisma.user.upsert({
    where: { email: "student@asmo.uz" },
    update: {},
    create: {
      email: "student@asmo.uz",
      passwordHash,
      firstName: "Aziz",
      lastName: "Karimov",
      phone: "+998901234567",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aziz",
      role: "STUDENT",
      status: "ACTIVE",
      coinBalance: 150,
    },
  });

  const peers = [
    { email: "peer1@asmo.uz", firstName: "Malika", lastName: "Yusupova", coinBalance: 210 },
    { email: "peer2@asmo.uz", firstName: "Javohir", lastName: "Toshev", coinBalance: 180 },
    { email: "peer3@asmo.uz", firstName: "Sardor", lastName: "Nazarov", coinBalance: 95 },
  ];
  for (const peer of peers) {
    const peerUser = await prisma.user.upsert({
      where: { email: peer.email },
      update: {},
      create: {
        email: peer.email,
        passwordHash,
        firstName: peer.firstName,
        lastName: peer.lastName,
        role: "STUDENT",
        status: "ACTIVE",
        coinBalance: peer.coinBalance,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.firstName}`,
      },
    });
    await prisma.enrollment.upsert({
      where: { userId_groupId: { userId: peerUser.id, groupId: group.id } },
      update: {},
      create: { userId: peerUser.id, groupId: group.id },
    });
  }

  await prisma.enrollment.upsert({
    where: { userId_groupId: { userId: student.id, groupId: group.id } },
    update: {},
    create: { userId: student.id, groupId: group.id },
  });

  // ── Lessons ──────────────────────────────────────────────────────────
  const lessonDefs = [
    { order: 1, offset: -14, topic: "IELTS Reading Strategies", status: "COMPLETED" as const },
    { order: 2, offset: -10, topic: "IELTS Listening Skills", status: "COMPLETED" as const },
    { order: 3, offset: -7, topic: "IELTS Writing Task 1", status: "COMPLETED" as const },
    { order: 4, offset: -3, topic: "IELTS Writing Task 2", status: "COMPLETED" as const },
    { order: 5, offset: 2, topic: "IELTS Speaking Part 1", status: "PLANNED" as const },
    { order: 6, offset: 5, topic: "IELTS Speaking Part 2", status: "PLANNED" as const },
  ];

  const lessons = [];
  for (const def of lessonDefs) {
    const lesson = await prisma.lesson.upsert({
      where: { groupId_lessonOrder: { groupId: group.id, lessonOrder: def.order } },
      update: {},
      create: {
        id: `les-00${def.order}`,
        groupId: group.id,
        topic: def.topic,
        lessonOrder: def.order,
        lessonDate: daysFrom(def.offset),
        status: def.status,
      },
    });
    lessons.push(lesson);
  }

  // ── Homework + submissions (for the demo student) ───────────────────
  const homeworkDefs = [
    { lesson: lessons[0], title: "Reading Passage 1 topshirig'i", deadlineOffset: -10, submit: "GRADED", score: 88 },
    { lesson: lessons[1], title: "Listening Test 1", deadlineOffset: -6, submit: "GRADED", score: 95 },
    { lesson: lessons[2], title: "Line Graph Essay", deadlineOffset: -3, submit: "SUBMITTED", score: null },
    { lesson: lessons[3], title: "Opinion Essay", deadlineOffset: 1, submit: null, score: null },
  ] as const;

  for (const [index, def] of homeworkDefs.entries()) {
    const homework = await prisma.homework.upsert({
      where: { id: `hw-00${index + 1}` },
      update: {},
      create: {
        id: `hw-00${index + 1}`,
        lessonId: def.lesson.id,
        title: def.title,
        description: `${def.title} bo'yicha topshiriqni diqqat bilan bajaring va belgilangan muddatgacha topshiring.`,
        maxScore: 100,
        deadline: daysFrom(def.deadlineOffset),
        status: "ACTIVE",
      },
    });

    if (def.submit) {
      await prisma.submission.upsert({
        where: { homeworkId_userId: { homeworkId: homework.id, userId: student.id } },
        update: {},
        create: {
          homeworkId: homework.id,
          userId: student.id,
          content: "Mening ishim: " + def.title,
          status: def.submit,
          score: def.score ?? undefined,
          feedback: def.submit === "GRADED" ? "Yaxshi bajarilgan, davom eting!" : undefined,
        },
      });
    }
  }

  // ── Attendance (for the completed lessons) ──────────────────────────
  const attendanceStatuses = ["PRESENT", "PRESENT", "LATE", "ABSENT"] as const;
  for (let i = 0; i < 4; i += 1) {
    await prisma.attendanceRecord.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: lessons[i].id } },
      update: {},
      create: {
        userId: student.id,
        lessonId: lessons[i].id,
        status: attendanceStatuses[i],
        markedAt: lessons[i].lessonDate,
      },
    });
  }

  // ── Coin transactions (kept in sync with student.coinBalance) ───────
  const coinTxDefs = [
    { id: "ctx-001", amount: 50, reason: "Darsga faol qatnashgani uchun" },
    { id: "ctx-002", amount: 40, reason: "Uyga vazifa a'lo bajarilgani uchun" },
    { id: "ctx-003", amount: 30, reason: "100% haftalik davomat" },
    { id: "ctx-004", amount: 30, reason: "Mock imtihonda yuqori ball" },
  ];
  for (const tx of coinTxDefs) {
    await prisma.coinTransaction.upsert({
      where: { id: tx.id },
      update: {},
      create: { id: tx.id, userId: student.id, amount: tx.amount, reason: tx.reason },
    });
  }

  // ── Notifications ────────────────────────────────────────────────────
  const notificationDefs = [
    {
      id: "notif-001",
      title: "Yangi uyga vazifa",
      message: "IELTS Writing Task 2 mavzusi bo'yicha esse topshirig'i berildi",
      type: "HOMEWORK" as const,
      isRead: false,
    },
    {
      id: "notif-002",
      title: "Uyga vazifa baholandi",
      message: "Listening Test 1 vazifangiz 95 ball bilan baholandi",
      type: "GRADE" as const,
      isRead: false,
    },
    {
      id: "notif-003",
      title: "Yaqinlashayotgan dars",
      message: "IELTS Speaking Part 1 darsi 2 kundan so'ng bo'lib o'tadi",
      type: "LESSON" as const,
      isRead: true,
    },
  ];
  for (const n of notificationDefs) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: { ...n, userId: student.id },
    });
  }

  // ── Products (shop) ──────────────────────────────────────────────────
  const productDefs = [
    {
      id: "prod-001",
      name: "Asmo Learning kepka",
      description: "Yumshoq g'ovakli, tabiiy matodan tikilgan brendli kepka",
      price: 80,
      category: "Aksessuar",
      image: "https://picsum.photos/seed/asmo-cap/400/400",
      rating: 4.6,
      reviews: 24,
      isPopular: true,
    },
    {
      id: "prod-002",
      name: "Asmo daftar to'plami",
      description: "3 dona A5 formatdagi qattiq muqovali daftarlar to'plami",
      price: 45,
      category: "Kanselyariya",
      image: "https://picsum.photos/seed/asmo-notebook/400/400",
      rating: 4.8,
      reviews: 52,
      isNew: true,
    },
    {
      id: "prod-003",
      name: "Asmo termostakan",
      description: "500ml hajmli, issiqlikni uzoq saqlaydigan termostakan",
      price: 120,
      originalPrice: 150,
      category: "Aksessuar",
      image: "https://picsum.photos/seed/asmo-bottle/400/400",
      rating: 4.9,
      reviews: 37,
      isLimited: true,
    },
    {
      id: "prod-004",
      name: "Asmo ryukzak",
      description: "Noutbukka mo'ljallangan, suv o'tkazmaydigan ryukzak",
      price: 300,
      category: "Aksessuar",
      image: "https://picsum.photos/seed/asmo-backpack/400/400",
      rating: 4.7,
      reviews: 18,
    },
  ];
  for (const p of productDefs) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: student.id, productId: "prod-003" } },
    update: {},
    create: { userId: student.id, productId: "prod-003" },
  });

  // ── Payments ─────────────────────────────────────────────────────────
  const paymentDefs = [
    {
      id: "pay-001",
      orderNumber: 1,
      amountNumber: 450000,
      status: "PAID" as const,
      paymentType: "CLICK" as const,
      paidAt: daysFrom(-20, 12, 0),
      description: "Iyun oyi uchun to'lov",
      receiptNumber: "RC-2024-0001",
    },
    {
      id: "pay-002",
      orderNumber: 2,
      amountNumber: 450000,
      status: "PENDING" as const,
      paymentType: "CASH" as const,
      paidAt: null,
      description: "Iyul oyi uchun to'lov",
      receiptNumber: undefined,
    },
    {
      id: "pay-003",
      orderNumber: 3,
      amountNumber: 450000,
      status: "OVERDUE" as const,
      paymentType: "PAYME" as const,
      paidAt: null,
      description: "May oyi uchun to'lov (muddati o'tgan)",
      receiptNumber: undefined,
    },
  ];
  for (const p of paymentDefs) {
    await prisma.payment.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, userId: student.id, teacherName: teacher.fullName },
    });
  }

  console.log("Seed completed. Demo login: student@asmo.uz / password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
