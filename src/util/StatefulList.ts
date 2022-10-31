// utility class to use when managing samples in a component
export default class StatefulList<T> {
    items: T[];

    constructor(items?: (T)[]) {
        this.items = items ?? [];
    }

    clone(): StatefulList<T>{
        return new StatefulList<T>(this.items);
    }

    move(from: number, to: number) {
        if (
          from < 0 ||
          from > this.items.length - 1 ||
          to < 0 ||
          to > this.items.length - 1
        ) {
          return;
        }

        this.items.splice(to, 0, this.items.splice(from, 1)[0]);
    }

    add(...items: T[]) {
        this.items.push(...items);
    }

    remove(i: number) {
        this.items.splice(i, 1);
    }

    set(i: number, item: T) {
        this.items[i] = item;
    }

}