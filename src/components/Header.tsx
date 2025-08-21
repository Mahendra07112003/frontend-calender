 

type Props = {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function Header({ month, year, onPrev, onNext }: Props) {
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return (
    <div className="flex justify-between items-center mb-4">
      <button onClick={onPrev} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
      <h2 className="font-bold text-lg">{monthNames[month]} {year}</h2>
      <button onClick={onNext} className="px-3 py-1 bg-gray-200 rounded">Next</button>
    </div>
  );
}
