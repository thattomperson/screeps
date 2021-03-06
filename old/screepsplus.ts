// Copyright © 2017 Douglas P. Fields, Jr. All Rights Reserved.
// Web: https://symbolics.lisp.engineer/
// E-mail: symbolics@lisp.engineer
// Twitter: @LispEngineer

// Module to format data in memory for use with the https://screepspl.us
// Grafana utility run by ags131.
//
// Installation: Run a node script from https://github.com/ScreepsPlus/node-agent
// And configure your screepspl.us token and Screeps login (if you use Steam,
// You have to create a password on the Profile page in Screeps),
// Then run that in the background (e.g., on Linode, AWS, your always-on Mac).
//
// Then, put whatever you want in Memory.stats, which will be collected every
// 15 seconds (yes, not every tick) by the above script and sent to screepspl.us.
// In this case, I call the collect_stats() routine below at the end of every
// Trip through the main loop, with the absolute final call at the end of the
// Main loop to update the final CPU usage.
//
// Then, configure a Grafana page (see example code) which graphs stuff whichever
// Way you like.
//
// This module uses my resources module, which analyzes the state of affairs
// For every room you can see.

'use strict';

import Callback from './callback';
import resources from './resources';

global.statsCallbacks = new Callback();

// Tell us that you want a callback when we're collecting the stats.
// We will send you in the partially completed stats object.
function addStatsCallback(cbfunc) {
  global.statsCallbacks.subscribe(cbfunc);
}

// Update the Memory.stats with useful information for trend analysis and graphing.
// Also calls all registered stats callback functions before returning.
function collectStats() {

  // Don't overwrite things if other modules are putting stuff into Memory.stats
  if (Memory.stats == null) {
    Memory.stats = { tick: Game.time };
  }

  // Note: This is fragile and will change if the Game.cpu API changes
  Memory.stats.cpu = Game.cpu;
  // Memory.stats.cpu.used = Game.cpu.getUsed(); // AT END OF MAIN LOOP

  // Note: This is fragile and will change if the Game.gcl API changes
  Memory.stats.gcl = Game.gcl;

  const memoryUsed = RawMemory.get().length;
  // Console.log('Memory used: ' + memoryUsed);
  Memory.stats.memory = {
    used: memoryUsed
    // Other memory stats here?
  };

  Memory.stats.market = {
    activeOrders: Game.market.orders ? _.filter(Game.market.orders, o => o.active).length : 0,
    buyOrders: Game.market.orders ? _.filter(Game.market.orders, o => o.type == ORDER_BUY && o.active).length : 0,
    credits: Game.market.credits,
    inactiveOrders: Game.market.orders ? _.filter(Game.market.orders, o => !o.active).length : 0,
    numOrders: Game.market.orders ? Object.keys(Game.market.orders).length : 0,
    // These are only actives

    remainingBuy: Game.market.orders
      ? _.sum(_.filter(Game.market.orders, (o) => o.type === ORDER_BUY && o.active), (o) => o.remainingAmount)
      : 0,
    remainingSell: Game.market.orders
      ? _.sum(_.filter(Game.market.orders, (o) => o.type === ORDER_SELL && o.active), (o) => o.remainingAmount)
      : 0,

    sellOrders: Game.market.orders
      ? _.filter(Game.market.orders, (o) => o.type === ORDER_SELL && o.active).length
      : 0,
    // TODO: Add details like number of orders executed in last N ticks, amount traded last N ticks,
    // Open buy/sell orders/amounts by resource, etc.
  };

  Memory.stats.roomSummary = resources.summarize_rooms();

  // Add callback functions which we can call to add additional
  // Statistics to here, and have a way to register them.
  // 1. Merge in the current repair ratchets into the room summary
  // TODO: Merge in the current creep desired numbers into the room summary
  global.statsCallbacks.fire(Memory.stats);
} // Collect_stats

export default {
  collectStats,
  addStatsCallback
};



// WEBPACK FOOTER //
// ./~/source-map-loader!./src/screepsplus.ts