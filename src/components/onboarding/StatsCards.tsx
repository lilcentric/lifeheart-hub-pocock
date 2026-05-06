interface StatCard {
  label: string;
  value: string | number;
  description?: string;
  highlight?: boolean;
}

interface Props {
  cards: StatCard[];
}

export default function StatsCards({ cards }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-gray-200 rounded-lg p-5"
        >
          <p className="text-sm text-gray-500">{card.label}</p>
          <p
            className={`text-3xl font-semibold mt-1 ${
              card.highlight ? "text-red-600" : "text-gray-900"
            }`}
          >
            {card.value}
          </p>
          {card.description && (
            <p className="text-xs text-gray-400 mt-1">{card.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
