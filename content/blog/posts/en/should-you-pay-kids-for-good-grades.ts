import type { BlogPost } from '../../types'

const post: BlogPost = {
  slug: 'should-you-pay-kids-for-good-grades',
  locale: 'en',
  title: 'Should You Pay Kids for Good Grades? What the Research Says',
  description:
    'What the research on paying children for grades actually shows – including the evidence against it – and how to design a reward system that keeps the risks small.',
  publishedAt: '2025-09-01',
  updatedAt: '2026-10-09',
  readingTimeMinutes: 7,
  sections: [
    {
      heading: 'The question every parent eventually asks',
      body: 'When report cards arrive, many parents reach for their wallet. Is that a good idea? The honest answer is that the research gives no simple yes or no – and part of it is a real warning. Bonifatus is a grade-reward app, which is exactly why we think you should see the evidence on both sides.',
    },
    {
      heading: 'The case against: rewards can crowd out motivation',
      body: "Psychologists distinguish intrinsic motivation (doing something because it interests you) from extrinsic motivation (doing it for a reward). The best-known summary of the research is a 1999 meta-analysis of 128 experiments by Deci, Koestner and Ryan. It found that **expected, tangible rewards reduced people's motivation to keep going with a task in their free time** – and that rewards tied to performance did so too, if somewhat less. The negative effect of tangible rewards tended to be **stronger for children** than for college students. Two findings point the other way: **unexpected** rewards had no measurable effect, and **positive feedback increased** motivation.\n\nFor a grade-reward rule this is uncomfortable: an amount per grade, agreed in advance, is exactly the kind of expected, tangible reward that came out worst. The findings are disputed – Cameron and Pierce concluded in their own meta-analysis that the effect is smaller and narrower – and most of the experiments were short lab studies with tasks people already found interesting. Schoolwork over a whole term is a different situation. But the warning should be taken seriously.",
    },
    {
      heading: 'What happened when schools actually paid students',
      body: "The largest field study comes from Harvard economist Roland Fryer (2011): a randomised experiment in 203 schools in Chicago, Dallas and New York with about 27,000 students (treatment and control groups combined). In Dallas, second graders earned $2 per book read; in New York, students were paid for interim test results; in Chicago, ninth graders were paid for their grades.\n\nThe result: **the payments had no statistically detectable effect on state test scores in any of the three cities.** In Chicago, the paid-for grades rose slightly, but only marginally significantly. The one clear improvement was in reading among English-speaking students in Dallas who were paid to read. Fryer also found little evidence that the payments reduced intrinsic motivation, and he stresses that his study cannot rule out small effects.\n\nOne detail stands out: students paid for test scores struggled to say what they could do to earn more. They mentioned test-taking tricks – nobody mentioned studying, doing homework or asking teachers for help. Fryer's own, explicitly speculative interpretation is that incentives work better when tied to things children can directly control, like reading a book, than to outcomes they don't know how to improve.",
    },
    {
      heading: 'The fairness argument',
      body: 'Beyond motivation research there is a practical case for a rule: in a family with several children, a rule agreed in advance treats siblings alike and takes the haggling out of report-card day. It comes at a price, though – an agreed reward is an expected reward, the type the lab studies flag. That is why the details below matter.',
    },
    {
      heading: 'If you reward: how to keep the risks small',
      body: "**1. Agree the rule in advance – together.** If your child helps shape it, it feels more like an agreement than a control.\n\n**2. Reward improvement, not just top grades.** A bonus for a grade that went up rewards something your child can influence.\n\n**3. Keep it small.** Your child's monthly pocket money is a useful yardstick; a bonus far above it puts the money centre stage.\n\n**4. Keep it separate from pocket money.** The German Youth Institute (DJI) advises against using pocket money as a reward for grades or cutting it as a punishment.\n\n**5. No deductions.** Poor grades call for support, not penalties.\n\n**6. Pair it with genuine praise.** Specific, honest feedback is the one thing the research consistently finds motivating.\n\n**7. Know when to skip it.** If your child already enjoys learning, or is anxious about school, there is little to gain and something to lose.",
    },
    {
      heading: 'The bottom line',
      body: 'Paying for grades is neither a miracle nor automatically harmful. The evidence suggests that money alone rarely raises results, and that expected rewards carry a real risk to motivation – especially for children who already enjoy learning. If you decide to reward, a small, transparent, improvement-focused bonus, kept separate from pocket money and paired with genuine praise, is the version the evidence supports best.',
    },
  ],
  faqs: [
    {
      question: 'Does paying for grades hurt intrinsic motivation?',
      answer:
        'It can. In a meta-analysis of 128 experiments, expected tangible rewards – including performance-based ones – reduced intrinsic motivation, more so in children. A large field study in US schools found little sign of this, but also found that money did not raise test scores.',
    },
    {
      question: 'What is a fair amount to pay for good grades?',
      answer:
        "There is no official norm. A practical yardstick is your child's monthly pocket money: a bonus far above it puts the money centre stage. Keep the bonus separate from pocket money itself.",
    },
    {
      question: 'Should I reward effort or results?',
      answer:
        "If you reward, prefer things your child can influence directly, such as improvement. In Roland Fryer's study, paying children to read books was the only incentive with a clear effect; paying for test scores had none.",
    },
    {
      question: 'Should I deduct money for bad grades?',
      answer:
        'We advise against it. Deductions turn a bonus into a means of pressure; poor grades are a reason for a conversation and for support.',
    },
  ],
  sources: [
    {
      text: 'Deci, E. L., Koestner, R. & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. Psychological Bulletin, 125(6), 627–668.',
      url: 'https://doi.org/10.1037/0033-2909.125.6.627',
    },
    {
      text: 'Cameron, J. & Pierce, W. D. (1994). Reinforcement, reward, and intrinsic motivation: A meta-analysis. Review of Educational Research, 64(3), 363–423.',
      url: 'https://doi.org/10.3102/00346543064003363',
    },
    {
      text: 'Fryer, R. G. (2011). Financial Incentives and Student Achievement: Evidence from Randomized Trials. The Quarterly Journal of Economics, 126(4), 1755–1798.',
      url: 'https://www.povertyactionlab.org/sites/default/files/research-paper/919_Financialincentives_and_student_Fryer_2011.pdf',
    },
    {
      text: 'Chabursky, S. & Langmeyer, A. (2025). Taschengeld und Gelderziehung. Deutsches Jugendinstitut.',
      url: 'https://www.dji.de/fileadmin/user_upload/dasdji/publikationen/Broschueren_2025/Expertise_Taschengeld_ChaburskyLangmeyer2025_aktualisiert.pdf',
    },
  ],
}

export default post
