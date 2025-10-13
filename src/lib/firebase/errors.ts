// This is a custom Error class that we can use to wrap a Firestore error and
// provide more context to the user.
//
// It should be used in a try/catch block when calling a Firestore function.
//
// Example:
//
//   try {
//     await addDoc(collection(db, 'my-collection'), { name: 'My Doc' });
//   } catch (e:any) {
//     throw new FirestorePermissionError({
//       path: 'my-collection',
//       operation: 'create',
//       requestResourceData: { name: 'My Doc' },
//     });
//   }
//

/**
 * The context of a security rule evaluation. This is the same as the
 * `request` object in a security rule.
 */
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

/**
 * A custom Error class that wraps a Firestore error and provides more context.
 */
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    super(
      `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules: \n${JSON.stringify(
        context,
        null,
        2
      )}`
    );
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
