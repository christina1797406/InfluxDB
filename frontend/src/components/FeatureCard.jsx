export default function FeatureCard({ image, title, description, alt }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">
        <img src={image} alt={alt} />
      </div>
      <div className="feature-title">{title}</div>
      <div className="feature-desc">{description}</div>
    </div>
  );
}
