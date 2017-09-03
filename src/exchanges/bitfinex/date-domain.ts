import * as Rx from 'rxjs';

export default function(cycleLength: number) {
    // TODO: make the earliest date in domain optional
    var twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - (24 * 7));

    var nearestDateInDomain = Math.floor(twentyFourHoursAgo.getTime() / cycleLength) * cycleLength;
    twentyFourHoursAgo.setTime(nearestDateInDomain);
    
    var now = new Date();
    var nextDateInDomain = Math.ceil(now.getTime() / cycleLength) * cycleLength;
    
    var futureDates = Rx.Observable
        .timer(new Date(nextDateInDomain), cycleLength)
        .map(cyclesSinceTimerStarted => new Date(nextDateInDomain + (cycleLength * cyclesSinceTimerStarted)));
    
    var pastDateCount = Math.floor((now.getTime() - nearestDateInDomain) / cycleLength);
    var pastDates = Rx.Observable
        .range(1, pastDateCount)
        .map(cycleNumber => new Date(cycleNumber * cycleLength + nearestDateInDomain));
    
    return pastDates.concat(futureDates);
}