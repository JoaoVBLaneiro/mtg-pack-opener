type Props = {
  onOpen: () => void;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  iconUrl?: string;
};

export default function BoosterPack({
  onOpen,
  disabled,
  title = "Booster",
  subtitle = "Click to open booster",
  iconUrl,
}: Props) {
  return (
    <button className="booster-pack" onClick={onOpen} disabled={disabled}>
      <div className="booster-pack__inner">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={title}
            style={{
              width: 56,
              height: 56,
              objectFit: "contain",
              marginBottom: 18,
              opacity: 0.95,
            }}
          />
        ) : null}

        <div className="booster-pack__title">{title}</div>
        <div className="booster-pack__subtitle">{subtitle}</div>
      </div>
    </button>
  );
}