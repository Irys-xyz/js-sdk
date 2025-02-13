// import Irys from "./irys";

// export class IrysBuilder<TReturn extends Irys = Irys> {
//     protected irysClass: TReturn;

//     public async build(): Promise<TReturn> {
//         return new this.irysClass()
//     }

//      // Promise contract functions, so users can `await` a builder instance to resolve the built client.
//   // very cool, thanks Knex.
//   /**
//    * Resolves `this` by building & initializing all the registered components
//    * @param onFulfilled - optional onFulfilled callback
//    * @returns - all results for built query
//    */
//   public async then(
//     onFulfilled?: ((value: TReturn) => any | PromiseLike<TReturn>) | undefined | null,
//     onRejected?: (value: Error) => any | PromiseLike<Error> | undefined | null,
//   ): Promise<TReturn | never> {
//     return this.build().then(onFulfilled, onRejected);
//   }

//   public async catch(onReject?: ((value: TReturn) => any | PromiseLike<TReturn>) | undefined | null): Promise<null> {
//     return this.then().catch(onReject);
//   }

//   public async finally(onFinally?: (() => void) | null | undefined): Promise<TReturn | null> {
//     return this.then().finally(onFinally);
//   }
// }
