import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [
            getCreatureDescription(this),
            super.getDescriptions()];
    }
}
// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}



// Основа для утки.
class Duck extends Creature {
    constructor() {
        super("Мирная утка", 2);
    }

    quacks() {
        console.log('quack');
    };

    swims() {
        console.log('float: both;');
    };
}


// Основа для собаки.
class Dog extends Creature {
    constructor(name="Пес-бандит", maxPower=3) {
        super(name, maxPower);
    }
}

class Trasher extends Dog {
    constructor() {
        super();
        this.maxPower = 5;
        this.currentPower = this.maxPower;
        this.name = 'Громила';
    }


    modifyTakenDamage(value, fromCard, gameContext, continuation){
        this.view.signalAbility(() => {
            continuation(value - 1);
        });
    }

    getDescriptions() {
        return [super.getDescriptions(), "если Громилу атакуют, то он получает на 1 меньше урона."];
    }
}

class Gatling extends Creature {
    constructor() {
        super("Гатлинг", 6);
    }
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        for(const card of oppositePlayer.table) {
            if (card === null)
                continue;
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                   this.dealDamageToCreature(this.currentPower, card, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);
    };
}

class Lad extends Dog{
    constructor() {
        super("Браток", 2);
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }
    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        Lad.setInGameCount(1);
        continuation();
    }
    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    };
    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        value += Lad.getBonus();
        continuation(value);
    };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        value -= Lad.getBonus();
        continuation(value);
    };
    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || Lad.prototype.hasOwnProperty('modifyTakenDamage')){
            return [super.getDescriptions(),
                "Чем их больше, тем они сильнее"];
        }
        return super.getDescriptions();
    }
}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Gatling(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Dog(),
    new Dog(),
    new Gatling(),
    new Dog(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});

