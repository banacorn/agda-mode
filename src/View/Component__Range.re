[@bs.config {jsx: 3}];

open Type.Location;

module Link = Component__Link;

[@react.component]
let make = (~range, ~abbr=false) =>
  if (abbr) {
    <Link jump=true target={Range.RangeLink(range)}>
      <span className="text-subtle range icon icon-link" />
    </Link>;
  } else {
    <Link jump=true target={Range.RangeLink(range)}>
      <span className="text-subtle range icon icon-link">
        {ReasonReact.string(Range.toString(range))}
      </span>
    </Link>;
  };
