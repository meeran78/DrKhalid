"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_src_lib_notify_ts";
exports.ids = ["_rsc_src_lib_notify_ts"];
exports.modules = {

/***/ "(rsc)/./src/lib/notify.ts":
/*!***************************!*\
  !*** ./src/lib/notify.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   notifyAdmins: () => (/* binding */ notifyAdmins),\n/* harmony export */   notifyPhysicians: () => (/* binding */ notifyPhysicians),\n/* harmony export */   notifyUser: () => (/* binding */ notifyUser)\n/* harmony export */ });\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/db */ \"(rsc)/./src/lib/db.ts\");\n\nasync function notifyUser(userId, type, title, body) {\n    await (0,_lib_db__WEBPACK_IMPORTED_MODULE_0__.sql)`\n    INSERT INTO notifications (user_id, type, title, body)\n    VALUES (${userId}, ${type}, ${title}, ${body || null})\n  `;\n}\nasync function notifyAdmins(type, title, body) {\n    const rows = await (0,_lib_db__WEBPACK_IMPORTED_MODULE_0__.sql)`SELECT user_id FROM profiles WHERE role = 'admin'`;\n    for (const r of rows){\n        await notifyUser(r.user_id, type, title, body);\n    }\n}\nasync function notifyPhysicians(type, title, body) {\n    const rows = await (0,_lib_db__WEBPACK_IMPORTED_MODULE_0__.sql)`SELECT user_id FROM physicians`;\n    for (const r of rows){\n        await notifyUser(r.user_id, type, title, body);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL25vdGlmeS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQStCO0FBRXhCLGVBQWVDLFdBQ3BCQyxNQUFjLEVBQ2RDLElBQVksRUFDWkMsS0FBYSxFQUNiQyxJQUFhO0lBRWIsTUFBTUwsNENBQUcsQ0FBQzs7WUFFQSxFQUFFRSxPQUFPLEVBQUUsRUFBRUMsS0FBSyxFQUFFLEVBQUVDLE1BQU0sRUFBRSxFQUFFQyxRQUFRLEtBQUs7RUFDdkQsQ0FBQztBQUNIO0FBRU8sZUFBZUMsYUFBYUgsSUFBWSxFQUFFQyxLQUFhLEVBQUVDLElBQWE7SUFDM0UsTUFBTUUsT0FBTyxNQUFNUCw0Q0FBRyxDQUFDLGlEQUFpRCxDQUFDO0lBQ3pFLEtBQUssTUFBTVEsS0FBS0QsS0FBTTtRQUNwQixNQUFNTixXQUFXTyxFQUFFQyxPQUFPLEVBQUVOLE1BQU1DLE9BQU9DO0lBQzNDO0FBQ0Y7QUFFTyxlQUFlSyxpQkFBaUJQLElBQVksRUFBRUMsS0FBYSxFQUFFQyxJQUFhO0lBQy9FLE1BQU1FLE9BQU8sTUFBTVAsNENBQUcsQ0FBQyw4QkFBOEIsQ0FBQztJQUN0RCxLQUFLLE1BQU1RLEtBQUtELEtBQU07UUFDcEIsTUFBTU4sV0FBV08sRUFBRUMsT0FBTyxFQUFFTixNQUFNQyxPQUFPQztJQUMzQztBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGRya2hhbGlkL3dlYi8uL3NyYy9saWIvbm90aWZ5LnRzPzFkZDIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc3FsIH0gZnJvbSBcIkAvbGliL2RiXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBub3RpZnlVc2VyKFxuICB1c2VySWQ6IHN0cmluZyxcbiAgdHlwZTogc3RyaW5nLFxuICB0aXRsZTogc3RyaW5nLFxuICBib2R5Pzogc3RyaW5nXG4pIHtcbiAgYXdhaXQgc3FsYFxuICAgIElOU0VSVCBJTlRPIG5vdGlmaWNhdGlvbnMgKHVzZXJfaWQsIHR5cGUsIHRpdGxlLCBib2R5KVxuICAgIFZBTFVFUyAoJHt1c2VySWR9LCAke3R5cGV9LCAke3RpdGxlfSwgJHtib2R5IHx8IG51bGx9KVxuICBgO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbm90aWZ5QWRtaW5zKHR5cGU6IHN0cmluZywgdGl0bGU6IHN0cmluZywgYm9keT86IHN0cmluZykge1xuICBjb25zdCByb3dzID0gYXdhaXQgc3FsYFNFTEVDVCB1c2VyX2lkIEZST00gcHJvZmlsZXMgV0hFUkUgcm9sZSA9ICdhZG1pbidgO1xuICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xuICAgIGF3YWl0IG5vdGlmeVVzZXIoci51c2VyX2lkLCB0eXBlLCB0aXRsZSwgYm9keSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG5vdGlmeVBoeXNpY2lhbnModHlwZTogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBib2R5Pzogc3RyaW5nKSB7XG4gIGNvbnN0IHJvd3MgPSBhd2FpdCBzcWxgU0VMRUNUIHVzZXJfaWQgRlJPTSBwaHlzaWNpYW5zYDtcbiAgZm9yIChjb25zdCByIG9mIHJvd3MpIHtcbiAgICBhd2FpdCBub3RpZnlVc2VyKHIudXNlcl9pZCwgdHlwZSwgdGl0bGUsIGJvZHkpO1xuICB9XG59XG4iXSwibmFtZXMiOlsic3FsIiwibm90aWZ5VXNlciIsInVzZXJJZCIsInR5cGUiLCJ0aXRsZSIsImJvZHkiLCJub3RpZnlBZG1pbnMiLCJyb3dzIiwiciIsInVzZXJfaWQiLCJub3RpZnlQaHlzaWNpYW5zIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/notify.ts\n");

/***/ })

};
;