import { Link } from 'react-router-dom';

export default function Brand({ to = '/' }) {
  return (
    <Link to={to} className="studio-brand" aria-label="EngLearn.art — Trang chủ">
      <span className="studio-mark" aria-hidden="true"><i /><i /><i /></span>
      <span>EngLearn<span className="brand-suffix">.art</span></span>
    </Link>
  );
}
