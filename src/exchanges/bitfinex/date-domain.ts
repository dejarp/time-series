import * as Rx from 'rxjs';
import AlignDate from '../../core/align-date'

export default function(cycleLength: number) {
    // TODO: make the earliest date in domain optional
    var twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - (24 * 7));

    var nearestDateInDomain = AlignDate(twentyFourHoursAgo, cycleLength);
    twentyFourHoursAgo.setTime(nearestDateInDomain.getTime());
    
    var now = new Date();
    var nextDateInDomain = Math.ceil(now.getTime() / cycleLength) * cycleLength;
    
    var futureDates = Rx.Observable
        .timer(new Date(nextDateInDomain), cycleLength)
        .map(cyclesSinceTimerStarted => new Date(nextDateInDomain + (cycleLength * cyclesSinceTimerStarted)));
    
    var pastDateCount = Math.floor((now.getTime() - nearestDateInDomain.getTime()) / cycleLength);
    var pastDates = Rx.Observable
        .range(1, pastDateCount)
        .map(cycleNumber => new Date(cycleNumber * cycleLength + nearestDateInDomain.getTime()));
    
    return pastDates.concat(futureDates);
}