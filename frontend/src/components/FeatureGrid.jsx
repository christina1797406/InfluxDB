import APILogo from '../images/API_Logo.png';
import ContactLogo from '../images/Contact_Logo.png';
import GraphLogo from '../images/Graph_Logo.png';
import QueryLogo from '../images/Query_Logo.png';
import FeatureCard from './FeatureCard';

export default function FeatureGrid() {
  const features = [
    {
      image: QueryLogo,
      title: 'Visual Query Builder',
      description: 'Build queries with clicks and drag-and-drop. No Flux code required.',
      alt: 'Visual Query Builder Icon',
    },
    {
      image: GraphLogo,
      title: 'Instant Visualisations',
      description: 'See your data come to life with multiple chart types and options.',
      alt: 'Instant Visualisations Icon',
    },
    {
      image: ContactLogo,
      title: 'Contact Us',
      description: 'Reach out to us for more questions or feedback at email@email.com',
      alt: 'Contact Us Icon',
    },
    {
      image: APILogo,
      title: 'Grafana Integration',
      description: 'Export visualizations directly to your existing Grafana dashboards.',
      alt: 'Grafana Integration Icon',
    },
  ];

  return (
    <div className="features-grid">
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  );
}
