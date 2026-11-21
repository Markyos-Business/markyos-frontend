"use client";

import { useState } from "react";
import { Button, Dashboard, ThemeToggle, UiStringsProvider, type DashboardPeriod } from "@/components/ui";
const {
  DashboardProvider, DashboardHeader, DashboardCard, MetricCard, BarChartCard, GaugeCard,
  ProgressCard, CountdownCard, ReminderCard, WelcomeCard, CardLinkButton, CardFooterStats,
  PeriodSelect, CategoryColumnChart, Sparkline, ActivityHeatmap, PipelineFlow, PipelineBar,
  ChartLegend, TaskList, TaskListItem, PeopleList, PeopleListItem, BreakdownTable, StatusTag,
  QuickActions, WidgetStateView,
} = Dashboard;

/** Fixture-only developer gallery. Production dashboards bind the same widgets to API data. */
export function DashboardGallery() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [recovered, setRecovered] = useState(false);
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const stages = [
    { id: "discovery", label: t("Discovery", "الاستكشاف"), count: 4, color: "cat-1" as const },
    { id: "design", label: t("Design", "التصميم"), count: 8, color: "cat-2" as const },
    { id: "review", label: t("Review", "المراجعة"), count: 2, color: "cat-3" as const },
  ];
  const bars = [{ label: t("Mon", "الاثنين"), value: 8 }, { label: t("Tue", "الثلاثاء"), value: 0 }, { label: t("Wed", "الأربعاء"), value: 5 }, { label: t("Thu", "الخميس"), value: 12 }, { label: t("Fri", "الجمعة"), value: 4, status: "pending" as const }];

  return <UiStringsProvider lang={lang}><DashboardProvider lang={lang}>
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto flex w-full max-w-7xl flex-col gap-space-6 bg-canvas px-space-5 py-space-8 text-text">
      <DashboardHeader title={t("Dashboard widgets", "مكونات لوحة المعلومات")} subtitle={t("Markyos component examples · fixture data", "أمثلة مكونات ماركيوس · بيانات تجريبية")}
        secondaryActions={<><Button href="/design-system" size="sm">{t("UI gallery", "مكتبة الواجهة")}</Button><Button size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "العربية" : "English"}</Button><ThemeToggle /></>}
      />
      {notice && <p role="status" className="text-caption text-accent-text">{notice}</p>}
      <div className="grid grid-cols-2 gap-space-4 xl:grid-cols-4">
        <MetricCard label={t("Brands", "العلامات")} value="24" caption={t("Across the workspace", "عبر مساحة العمل")} />
        <MetricCard label={t("New brands", "علامات جديدة")} value="8" delta={{ value: 12, comparedTo: t("vs last month", "مقارنة بالشهر السابق") }} variant="highlighted" />
        <MetricCard label={t("Activity", "النشاط")} value="42" variant="bars" bars={[3, 6, 4, 9, 12]} barsLabel={t("Recent activity", "النشاط الأخير")} />
        <MetricCard label={t("Loading metric", "مؤشر قيد التحميل")} value="" state="loading" />
      </div>
      <div className="grid items-start gap-space-5 lg:grid-cols-2">
        <BarChartCard title={t("Asset uploads", "رفع الأصول")} data={bars} label={t("Uploads per day", "الملفات المرفوعة يوميًا")} unit={t("uploads", "ملفات")}
          menu={{ label: t("Chart options", "خيارات الرسم"), extraItems: [{ label: t("Refresh preview", "تحديث المعاينة"), icon: "sync", onClick: () => setNotice(t("Preview refreshed.", "تم تحديث المعاينة.")) }] }}
          stats={[{ label: t("Uploaded", "مرفوعة"), value: 25 }, { label: t("Pending", "قيد الانتظار"), value: 4 }]} />
        <GaugeCard title={t("Brand stages", "مراحل العلامات")} label={t("Brand stage distribution", "توزيع مراحل العلامات")} centerLabel="24" centerCaption={t("brands", "علامات")}
          segments={[{ label: t("Design", "التصميم"), value: 50, color: "cat-1" }, { label: t("Review", "المراجعة"), value: 30, color: "cat-2" }, { label: t("Live", "منشورة"), value: 20, color: "cat-3" }]} />
        <DashboardCard title={t("Period and categories", "الفترة والفئات")} actions={<PeriodSelect value={period} onChange={setPeriod} />}>
          <p className="mb-space-4 text-caption text-text-muted">{t("Selected period", "الفترة المختارة")}: {period}</p>
          <CategoryColumnChart label={t("Assets by type", "الأصول حسب النوع")} data={[{ key: "logos", label: t("Logos", "الشعارات"), value: 12 }, { key: "fonts", label: t("Fonts", "الخطوط"), value: 0 }, { key: "images", label: t("Images", "الصور"), value: 8 }]} />
        </DashboardCard>
        <DashboardCard title={t("Team activity", "نشاط الفريق")}>
          <ActivityHeatmap label={t("Uploads by day and hour", "الملفات حسب اليوم والساعة")} rows={[t("Mon", "الاثنين"), t("Tue", "الثلاثاء")]} columns={["09:00", "12:00", "15:00"]} values={[[1, 2, 0], [4, 6, 2]]} unit={t("uploads", "ملفات")} />
          <Sparkline label={t("Recent uploads", "الملفات الأخيرة")} values={[1, 4, 2, 8, 6]} className="mt-space-5 h-10 w-full" />
        </DashboardCard>
      </div>
      <DashboardCard title={t("Brand workflow", "سير عمل العلامة")}>
        <PipelineFlow stages={stages} selectedId={selected} onSelect={setSelected} label={t("Brands by stage", "العلامات حسب المرحلة")} />
        <p role="status" className="my-space-4 text-caption text-text-muted">{selected ?? t("All stages", "كل المراحل")}</p>
        <PipelineBar stages={stages} label={t("Brand stages", "مراحل العلامات")} />
        <ChartLegend items={stages.map(s => ({ label: s.label, color: s.color, value: String(s.count) }))} className="mt-space-4" />
      </DashboardCard>
      <div className="grid items-start gap-space-5 lg:grid-cols-2">
        <DashboardCard title={t("Review tasks", "مهام المراجعة")}>
          <TaskList label={t("Tasks", "المهام")} count={2}>
            <TaskListItem title={t("Review logo variants", "مراجعة نسخ الشعار")} dueInDays={0} action={<Button size="sm" onClick={() => setNotice(t("Review preview opened.", "تم فتح معاينة المراجعة."))}>{t("Review", "مراجعة")}</Button>} />
            <TaskListItem title={t("Confirm brand guidelines", "تأكيد إرشادات العلامة")} dueInDays={-2} />
          </TaskList>
        </DashboardCard>
        <DashboardCard title={t("People", "الأشخاص")} actions={<CardLinkButton href="/admin/users" label={t("Open users", "فتح المستخدمين")} />}>
          <PeopleList label={t("Brand team", "فريق العلامة")} count={1}><PeopleListItem name="Nour Haddad" work={t("Reviewing brand assets", "يراجع أصول العلامة")} status="active" statusLabel={t("Active", "نشط")} /></PeopleList>
        </DashboardCard>
        <WelcomeCard name="Nour Haddad" date="2026-11-16T09:00:00Z" message={t("3 accounts are waiting for setup.", "3 حسابات بانتظار الإعداد.")} actions={[{ label: t("Manage users", "إدارة المستخدمين"), href: "/admin/users", primary: true }, { label: t("Website content", "محتوى الموقع"), href: "/admin/cms" }]} />
        <ProgressCard title={t("Brand setup", "إعداد العلامة")} done={3} total={5} />
        <CountdownCard heading={t("Brand launch", "إطلاق العلامة")} target="2027-01-01T12:00:00Z" now={new Date("2026-11-16T12:00:00Z")} />
        <ReminderCard heading={t("Upcoming review", "المراجعة القادمة")} title={t("Brand guidelines review", "مراجعة إرشادات العلامة")} startsAt="2026-12-01T12:00:00Z" location={t("Design team", "فريق التصميم")} cta={{ label: t("Open preview", "فتح المعاينة"), onClick: () => setNotice(t("Review preview opened.", "تم فتح معاينة المراجعة.")) }} />
        <DashboardCard title={t("Account summary", "ملخص الحسابات")} footer={<CardFooterStats items={[{ label: t("Active", "نشط"), value: 24 }, { label: t("Pending", "قيد الانتظار"), value: 3 }]} />}>
          <BreakdownTable caption={t("Accounts by type", "الحسابات حسب النوع")} rows={[{ key: "studio", label: t("Studio", "استوديو"), value: 12, growth: 0 }, { key: "company", label: t("Company", "شركة"), value: 8, growth: -4 }]} />
          <div className="mt-space-4"><StatusTag status="active" label={t("Active", "نشط")} tone="success" /></div>
        </DashboardCard>
      </div>
      <QuickActions actions={[{ label: t("Manage users", "إدارة المستخدمين"), href: "/admin/users", description: t("Review accounts and invitations", "مراجعة الحسابات والدعوات"), icon: "users" }, { label: t("Website content", "محتوى الموقع"), href: "/admin/cms", description: t("Manage published content", "إدارة المحتوى المنشور"), icon: "globe" }]} />
      <div className="grid items-start gap-space-5 md:grid-cols-3">
        <DashboardCard title={t("Loading", "التحميل")} state="loading" skeleton="chart" />
        <DashboardCard title={t("Empty", "فارغ")} state="empty" />
        <DashboardCard title={t("Error and retry", "الخطأ وإعادة المحاولة")}><WidgetStateView state={recovered ? "empty" : "error"} onRetry={() => setRecovered(true)} emptyMessage={t("Retry completed. No data yet.", "اكتملت إعادة المحاولة. لا توجد بيانات بعد.")} /></DashboardCard>
      </div>
    </main>
  </DashboardProvider></UiStringsProvider>;
}
