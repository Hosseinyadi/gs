import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FAQ = () => {
  const generalFAQs = [
    {
      question: "گاراژ سنگین چیست؟",
      answer: "گاراژ سنگین یک پلتفرم آنلاین برای خرید، فروش و اجاره ماشین‌آلات سنگین در ایران است. ما بستری امن و کارآمد برای ارتباط مستقیم بین خریداران، فروشندگان و اجاره‌دهندگان ماشین‌آلات فراهم کرده‌ایم."
    },
    {
      question: "ثبت‌نام در سایت رایگان است؟",
      answer: "بله، ثبت‌نام در گاراژ سنگین کاملاً رایگان است. شما می‌توانید با شماره موبایل خود ثبت‌نام کنید و از امکانات سایت استفاده کنید."
    },
    {
      question: "چگونه می‌توانم آگهی ثبت کنم؟",
      answer: "پس از ورود به حساب کاربری، روی دکمه «ثبت آگهی» کلیک کنید. سپس نوع آگهی (فروش یا اجاره)، دسته‌بندی، مشخصات و تصاویر ماشین‌آلات خود را وارد کنید. آگهی شما پس از بررسی توسط تیم ما منتشر خواهد شد."
    },
    {
      question: "آیا ثبت آگهی هزینه دارد؟",
      answer: "ثبت آگهی اول رایگان است. برای آگهی‌های بیشتر یا ویژه کردن آگهی، هزینه‌ای متناسب دریافت می‌شود که در زمان ثبت به شما اعلام خواهد شد."
    },
  ];

  const buyingFAQs = [
    {
      question: "چگونه می‌توانم با فروشنده تماس بگیرم؟",
      answer: "در صفحه هر آگهی، دکمه «نمایش شماره تماس» وجود دارد. با کلیک روی آن، شماره تماس فروشنده نمایش داده می‌شود و می‌توانید مستقیماً تماس بگیرید."
    },
    {
      question: "آیا گاراژ سنگین در معاملات دخالت می‌کند؟",
      answer: "خیر، گاراژ سنگین فقط یک پلتفرم واسط است و در معاملات بین خریدار و فروشنده دخالتی ندارد. توصیه می‌کنیم قبل از هر معامله، کالا را حضوری بررسی کنید."
    },
    {
      question: "چگونه از کلاهبرداری جلوگیری کنم؟",
      answer: "هرگز قبل از دیدن کالا پول پرداخت نکنید. از واریز به حساب اشخاص ثالث خودداری کنید. اصالت مدارک و سند دستگاه را بررسی کنید. در صورت مشکوک بودن آگهی، آن را گزارش دهید."
    },
  ];

  const sellingFAQs = [
    {
      question: "چگونه آگهی خود را ویژه کنم؟",
      answer: "در پنل کاربری، بخش «آگهی‌های من» را باز کنید و روی دکمه «ویژه کردن» کلیک کنید. سپس مدت زمان ویژه بودن را انتخاب و هزینه را پرداخت کنید."
    },
    {
      question: "آگهی من چقدر فعال می‌ماند؟",
      answer: "آگهی‌ها به مدت ۳۰ روز فعال هستند. قبل از انقضا، اعلان یادآوری برای شما ارسال می‌شود و می‌توانید آگهی را تمدید کنید."
    },
    {
      question: "چرا آگهی من تایید نشد؟",
      answer: "آگهی‌ها ممکن است به دلایلی مانند: اطلاعات ناقص، تصاویر نامناسب، قیمت غیرواقعی یا عدم تطابق با قوانین سایت رد شوند. در صورت رد، دلیل آن به شما اعلام می‌شود."
    },
    {
      question: "چگونه آگهی خود را حذف کنم؟",
      answer: "در پنل کاربری، بخش «آگهی‌های من» را باز کنید و روی دکمه حذف کلیک کنید. دلیل حذف را انتخاب کنید. آگهی به بخش «حذف شده‌ها» منتقل می‌شود."
    },
  ];

  const paymentFAQs = [
    {
      question: "روش‌های پرداخت چیست؟",
      answer: "در حال حاضر پرداخت از طریق کارت به کارت انجام می‌شود. پس از واریز، رسید پرداخت را در سیستم ثبت کنید تا توسط پشتیبانی تایید شود."
    },
    {
      question: "آیا امکان استرداد وجه وجود دارد؟",
      answer: "در صورتی که خدمات ارائه نشده باشد، امکان استرداد وجه وجود دارد. برای این کار با پشتیبانی تماس بگیرید."
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">سوالات متداول</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              پاسخ سوالات رایج کاربران را در اینجا بیابید
            </p>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* General */}
            <div className="mb-12">
              <Badge className="mb-4">عمومی</Badge>
              <h2 className="text-2xl font-bold mb-6">سوالات عمومی</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {generalFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`general-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-right hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Buying */}
            <div className="mb-12">
              <Badge className="mb-4" variant="secondary">خرید</Badge>
              <h2 className="text-2xl font-bold mb-6">سوالات خریداران</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {buyingFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`buying-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-right hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Selling */}
            <div className="mb-12">
              <Badge className="mb-4" variant="outline">فروش</Badge>
              <h2 className="text-2xl font-bold mb-6">سوالات فروشندگان</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {sellingFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`selling-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-right hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Payment */}
            <div className="mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800">پرداخت</Badge>
              <h2 className="text-2xl font-bold mb-6">سوالات مالی</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {paymentFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`payment-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-right hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Contact */}
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">سوال شما در لیست نبود؟</h3>
                <p className="text-muted-foreground mb-6">
                  با تیم پشتیبانی ما تماس بگیرید
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/contact">
                    <Button>
                      <Mail className="w-4 h-4 ml-2" />
                      تماس با ما
                    </Button>
                  </Link>
                  <Button variant="outline">
                    <Phone className="w-4 h-4 ml-2" />
                    ۰۲۱-۸۸۷۷۶۶۵۵
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
