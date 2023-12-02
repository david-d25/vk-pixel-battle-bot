export function wildcardMatch(pattern: string, str: string) {
    const regex = new RegExp('^' + pattern.split(/\*+/).map(regExpEscape).join('.*') + '$');
    return regex.test(str);
}

export function regExpEscape(literalString: string) {
    return literalString.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}

export function secondsToHumanReadable(seconds: number): string {
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    let hours = Math.floor(minutes / 60);
    minutes -= hours * 60;
    let days = Math.floor(hours / 24);
    hours -= days * 24;
    let weeks = Math.floor(days / 7);
    days -= weeks * 7;
    let months = Math.floor(weeks / 4);
    weeks -= months * 4;
    let years = Math.floor(months / 12);
    months -= years * 12;

    let result = ``;
    if (years > 0) result += `${years} г. `;
    if (months > 0) result += `${months} мес. `;
    if (weeks > 0) result += `${weeks} н. `;
    if (days > 0) result += `${days} д. `;
    if (hours > 0) result += `${hours} ч. `;
    if (minutes > 0) result += `${minutes} м. `;
    if (seconds > 0) result += `${seconds} с. `;
    return result.trim();
}