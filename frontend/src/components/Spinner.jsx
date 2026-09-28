const Spinner = ({ size = 16, className = "" }) => (
  <div
    className={`spin border-2 border-zinc-700 border-t-white rounded-full flex-shrink-0 ${className}`}
    style={{ width: size, height: size }}
  />
);

export default Spinner;