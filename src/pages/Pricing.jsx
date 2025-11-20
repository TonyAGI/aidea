import '../styles/pricing.css';

const plans = [
  {
    name: 'Searcher',
    price: '$0',
    cadence: '/ month',
    cta: 'Get started',
    subtitle: 'Best for trying things out',
    fineprint: '*Weekly request availability may vary based on chatbot capacity.',
    features: [
      ['✨', 'Temper-1 access for everyday tasks'],
      ['📨', '10–20 requests per week*'],
      ['⚙️', 'Balanced responses with concise reasoning'],
      ['divider'],
      ['📝', 'Notes: write, organize, and save AI replies into your Notes'],
      ['✏️', 'Sketch: draw ideas; save to Notes or attach into the chat'],
      ['📄', 'Upload PDFs for quick previews in the chat'],
    ],
  },
  {
    name: 'Explorer',
    price: '$10',
    cadence: '/ month',
    cta: 'Upgrade',
    badge: 'POPULAR',
    subtitle: 'Great for regular use',
    fineprint: '*Limits apply.',
    featured: true,
    features: [
      ['🚀', 'Temper-1 and Temper-1 Colossus'],
      ['📨', '20–50 requests per week*'],
      ['🧠', 'More detailed reasoning and larger tasks'],
      ['divider'],
      ['📝', 'Notes: unlimited saves and AI-to-Notes export'],
      ['✏️', 'Sketch: save drawings to Notes or directly into a chat'],
      ['📎', 'Expanded uploads (images, PDFs) with previews'],
    ],
  },
  {
    name: 'Navigator',
    price: '$50',
    cadence: '/ month',
    cta: 'Go Pro',
    subtitle: 'For power users and teams',
    fineprint: 'Throughput may vary depending on chatbot availability and fair-use guardrails.',
    features: [
      ['♾️', 'Unlimited access to all current models'],
      ['🧪', 'First to try frontier models like Temper-2'],
      ['⚡', 'Highest responsiveness and longest sessions'],
      ['divider'],
      ['📝', 'Notes: full document workspace with chat saves'],
      ['✏️', 'Sketch: project boards and drawing saves into Notes or chats'],
      ['📦', 'Largest uploads and previews for PDFs and images'],
    ],
  },
];

const Pricing = () => (
  <div className="pricing-page">
    <section className="pricing-hero">
      <h1>Choose your plan</h1>
      <p>Start free. Upgrade for more requests, larger models, and early access to new frontiers.</p>
    </section>

    <section className="pricing-grid">
      {plans.map((plan) => (
        <div key={plan.name} className={`plan${plan.featured ? ' featured' : ''}`}>
          <div className="plan-header">
            <h3>{plan.name}</h3>
            {plan.badge && <span className="badge">{plan.badge}</span>}
          </div>
          <div className="price">
            {plan.price} <span>{plan.cadence}</span>
          </div>
          <ul className="features">
            {plan.features.map((feature, index) =>
              feature[0] === 'divider' ? (
                <li key={`${plan.name}-divider-${index}`} className="hr" />
              ) : (
                <li key={`${plan.name}-${feature[1]}`}>
                  <span className="icon">{feature[0]}</span>
                  <span>{feature[1]}</span>
                </li>
              ),
            )}
          </ul>
          <button type="button" className="cta-btn">
            {plan.cta}
          </button>
          <div className="subtle">{plan.subtitle}</div>
          <div className="fineprint">{plan.fineprint}</div>
        </div>
      ))}
    </section>
  </div>
);

export default Pricing;

