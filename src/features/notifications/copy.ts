import type { NotificationItem } from "./types";
export function notificationText(item:NotificationItem,isAr:boolean){
  const t=(en:string,ar:string)=>isAr?ar:en;
  const titles:Record<string,string>={
    welcome:t("Welcome to Markyos","مرحبًا بك في ماركيوس"),
    "account.invited":t("Your account is ready to set up","حسابك جاهز للإعداد"),
    "account.invite_resent":t("Your invitation was resent","أُعيد إرسال دعوتك"),
    "account.role_changed":t("Your role was updated","تم تحديث دورك"),
    "account.type_changed":t("Your account type was updated","تم تحديث نوع حسابك"),
    "account.deactivated":t("Your account access was disabled","تم تعطيل الوصول إلى حسابك"),
    "account.reactivated":t("Your account access was restored","تمت استعادة الوصول إلى حسابك"),
    "account.signed_out":t("Your sessions were signed out","تم تسجيل الخروج من جلساتك"),
    "account.session_ended":t("One of your sessions was ended","تم إنهاء إحدى جلساتك"),
    "discovery.first_answer":t("A client started answering","بدأ عميل بالإجابة"),
    "discovery.section_completed":t("A questionnaire section was completed","اكتمل قسم من الاستبيان"),
    "discovery.submitted":t("New questionnaire answers are ready","إجابات جديدة للاستبيان جاهزة"),
    help_published:t("Your Help article is live","مقالتك في مركز المساعدة منشورة الآن"),
    help_sent_back:t("Changes requested on your Help article","طُلبت تعديلات على مقالتك في مركز المساعدة"),
  };
  return {title:titles[item.kind]??t("Account update","تحديث الحساب"),
    body:item.kind==="welcome"?t("Your account and questionnaire updates appear here.","تظهر تحديثات حسابك واستبياناتك هنا."):item.kind.startsWith("discovery.")?[item.data.form,clientName(item.data.client,isAr)].filter(Boolean).join(" · "):item.kind.startsWith("help_")?[item.data.title,item.data.comment].filter(Boolean).join(" · "):item.data.actor?t(`Updated by ${item.data.actor}`,`تم التحديث بواسطة ${item.data.actor}`):""};
}
/** Treat API destinations as internal paths, including when older data exists. */
export function notificationHref(value:string){return /^\/(?![\\/])/.test(value)&&!/[\\\u0000-\u001f\u007f]/.test(value)?value:"/brands";}

/** The server writes a plain "client" when the recipient has no name; say it in the reader's language. */
function clientName(name:unknown,isAr:boolean){
  if(typeof name!=="string"||!name)return "";
  return name.toLowerCase()==="client"?(isAr?"العميل":"Client"):name;
}
