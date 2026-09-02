const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNotifications() {
  console.log('=== Testing Notification System ===\n');

  // Get a user with a company
  const user = await prisma.user.findFirst({
    where: {
      email: 'soniajaiswal2222@gmail.com',
    },
    select: {
      id: true,
      email: true,
      companyId: true,
    },
  });

  if (!user) {
    console.log('❌ Test user not found');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Test User: ${user.email} (Company: ${user.companyId})`);

  // Create a test notification
  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      company: { connect: { id: user.companyId } },
      title: '🎉 Test Notification - Blog Published!',
      message: 'This is a test notification to verify the system is working correctly.',
      type: 'blog_published',
      read: false,
    },
  });

  console.log(`✅ Notification Created: ${notification.id}`);
  console.log(`   Title: ${notification.title}`);
  console.log(`   Type: ${notification.type}`);
  console.log(`   Read: ${notification.read ? 'Yes' : 'No'}`);

  // Verify it shows up in user's notifications
  const userNotifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  console.log(`\n✅ User has ${userNotifications.length} notifications:`);
  userNotifications.forEach((n, i) => {
    console.log(`  ${i + 1}. ${n.title} (${n.type})`);
  });

  console.log('\n=== Notification Test Complete ===');
  await prisma.$disconnect();
}

testNotifications().catch(console.error);
