export default function AlignDate(date: Date, cycleLength: number) : Date {
    return new Date(Math.floor(date.getTime() / cycleLength) * cycleLength);
}